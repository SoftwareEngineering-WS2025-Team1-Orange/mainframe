import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { StatusCodes } from 'http-status-codes';
import { JobName, PluginName } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { formatMessage, formatError } from '@/utils/ws.helper';
import { MoneroIntegratedAddressService } from '@/utils/integrated_address_generator/monero_integrated_key.service';
import { MoneroIntegratedPublicAddress } from '@/utils/integrated_address_generator/types';
import {
  ContainerStatusDto,
  DonationBoxDtoResponse,
  DonationBoxPowerSupplyStatusDto,
  JwtDonationBoxDto,
  JwtDonationBoxDtoResponse,
} from '@/api-donationbox/donationbox/dto';
import {
  SolarStatusCodes,
  SolarStatusMessages,
} from '@/shared/services/types/SolarStatusMessages';
import { StandardContainerNames } from '@/shared/services/types/StandardContainerNames';

const DELTA = 20;

@Injectable()
export class DonationboxService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
    private moneroIntegratedKeyService: MoneroIntegratedAddressService,
  ) {
    const loadMiner = async () => {
      await prismaService.job.upsert({
        where: {
          name: JobName.MONERO_MINER,
        },
        update: {},
        create: {
          name: JobName.MONERO_MINER,
          imageUri: 'pmietlicki/monero-miner',
        },
      });

      await prismaService.supportedPowerSupply.upsert({
        where: {
          name: PluginName.E3DC,
        },
        update: {},
        create: {
          name: PluginName.E3DC,
          configSchema: '{}',
          imageUri:
            'ghcr.io/softwareengineering-ws2025-team1-orange/donation-box-e3dc-plugin:preview',
        },
      });
    };
    loadMiner().catch(() => {});
    this.setDonationboxesToDisconnected().catch(() => {});
  }

  private async setDonationboxesToDisconnected() {
    const containers = await this.prismaService.container.findMany({
      where: {
        name: StandardContainerNames.MAIN,
      },
      select: {
        id: true,
      },
    });
    await Promise.all(
      containers.map((container) =>
        this.prismaService.containerStatus.create({
          data: {
            statusCode: 1,
            statusMsg: 'Disconnected',
            container: {
              connect: {
                id: container.id,
              },
            },
          },
        }),
      ),
    );
  }

  async initNewDonationBox(): Promise<DonationBoxDtoResponse> {
    try {
      const cuid = createId();
      const moneroIntegratedPublicAddress: MoneroIntegratedPublicAddress =
        await this.moneroIntegratedKeyService.generateIntegratedAddress();
      await this.prismaService.donationBox.create({
        data: {
          cuid,
          name: null,
          integratedPublicMoneroAddress:
            moneroIntegratedPublicAddress.integratedPublicAddress,
          integratedPublicMoneroAddressId:
            moneroIntegratedPublicAddress.integratedPublicAddressId,
        },
      });
      return { cuid };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to initialize donation box',
        error,
      );
    }
  }

  async generateToken(cuid: string): Promise<JwtDonationBoxDtoResponse> {
    const token = await this.jwtService.signAsync(
      { cuid },
      {
        secret: this.configService.get('DONATIONBOX_JWT_ACCESS_SECRET'),
      },
    );
    return { token };
  }

  authorizedClients: Map<WebSocket, number> = new Map();

  private async getDonationBoxIdByCuid(cuid: string): Promise<number> {
    const donationBox = await this.prismaService.donationBox.findUnique({
      select: {
        id: true,
      },
      where: {
        cuid,
      },
    });
    return donationBox?.id;
  }

  private async addAuthorizedClient(client: WebSocket, cuid: string) {
    const donationBoxId = await this.getDonationBoxIdByCuid(cuid);
    this.authorizedClients.set(client, donationBoxId);
  }

  removeAuthorizedClient(client: WebSocket) {
    this.authorizedClients.delete(client);
  }

  isAuthorizedClient(client: WebSocket): boolean {
    if (!this.authorizedClients.has(client)) {
      client.send(
        formatError('authResponse', StatusCodes.FORBIDDEN, 'Unauthorized'),
      );
      client.close();
      return false;
    }
    return true;
  }

  private async verifyToken(jwtDto: JwtDonationBoxDto): Promise<string | null> {
    const { token } = jwtDto;
    try {
      // Verify JWT token
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('DONATIONBOX_JWT_ACCESS_SECRET'),
      });
      return token;
    } catch {
      return null;
    }
  }

  async verifyClient(
    client: WebSocket,
    token_wrapper: JwtDonationBoxDto,
  ): Promise<boolean> {
    const token = await this.verifyToken(token_wrapper);

    if (!token) return false;

    const { cuid }: { cuid: string } = this.jwtService.decode(token);

    const clientExists = await this.prismaService.donationBox.findUnique({
      where: {
        cuid,
      },
    });

    if (!clientExists) return false;

    await this.addAuthorizedClient(client, cuid);

    /**
     * WITH latestMessage AS (
     *   SELECT container_id, MAX(created_at) as created_at FROM container_status
     *    GROUP BY container_id
     * ), latestSuccess AS (
     *   SELECT * FROM latestMessage, container_status
     *   WHERE latestMessage.container_id = container_status.container_id
     *   AND container.status_code >= 200
     * )
     * SELECT container_id FROM container, latestSuccess
     * WHERE container.id = latestSuccess.container_id
     */

    const latestMessages = await this.prismaService.containerStatus.groupBy({
      by: ['containerId'],
      _max: {
        createdAt: true,
      },
    });

    const latestSuccess = await this.prismaService.containerStatus.findMany({
      where: {
        OR: latestMessages.map((message) => ({
          containerId: message.containerId,
          // eslint-disable-next-line no-underscore-dangle
          createdAt: message._max.createdAt,
          statusCode: {
            gte: 200,
          },
        })),
      },
    });

    const result = await this.prismaService.container.findMany({
      where: {
        id: {
          in: latestSuccess.map((success) => success.containerId),
        },
      },
      select: {
        name: true,
      },
    });

    client.send(
      formatMessage('authResponse', {
        success: true,
        monitored_containers: result.map((container) => container.name),
      }),
    );
    return true;
  }

  private async dispatchStop(client: WebSocket, jobName: JobName) {
    const job = await this.prismaService.job.findUnique({
      where: {
        name: jobName,
      },
    });
    await this.addWorkingStatusToLogs(client, false); // Assume container stops fast
    return client.send(
      formatMessage('stopContainerRequest', {
        containerName: job.name,
      }),
    );
  }

  private async dispatchReady(client: WebSocket, jobName: JobName) {
    const job = await this.prismaService.job.findUnique({
      where: {
        name: jobName,
      },
    });
    await this.addWorkingStatusToLogs(client, true); // Assume container starts fast
    return client.send(
      formatMessage('startContainerRequest', {
        imageName: job.imageUri,
        containerName: job.name,
        environmentVars: {
          POOL_USER: this.configService.get<string>('MONERO_WALLET_PUBLIC_KEY'),
          POOL_URL: 'pool.hashvault.pro:80',
        },
      }),
    );
  }

  async handleContainerStatusResponse(
    client: WebSocket,
    status: ContainerStatusDto[],
  ) {
    const logs = status.map(async (statusDto) =>
      this.handleContainerStatusInsertToDB(statusDto, client),
    );
    await Promise.all(logs);
  }

  async handlePowerSupplyStatusResponse(
    client: WebSocket,
    container: ContainerStatusDto[],
    status?: DonationBoxPowerSupplyStatusDto,
  ): Promise<void> {
    if (status == null) {
      await this.addWorkingStatusToLogs(client, true);
      return container.some((c) => c.containerName === JobName.MONERO_MINER)
        ? Promise.resolve()
        : this.dispatchReady(client, JobName.MONERO_MINER);
    }

    await this.prismaService.donationBox.update({
      where: {
        id: this.authorizedClients.get(client),
      },
      data: {
        lastSolarData: JSON.stringify(status),
        solarDataLastSuccessfulUpdateAt: new Date(Date.now()),
      },
    });

    // For MVP checking monero is enough
    await (container.some((c) => c.containerName === JobName.MONERO_MINER)
      ? this.addWorkingStatusToLogs(client, true)
      : this.addWorkingStatusToLogs(client, false));

    if (
      status.production.grid + DELTA >= 0 &&
      container.some((c) => c.containerName === JobName.MONERO_MINER)
    ) {
      return this.dispatchStop(client, JobName.MONERO_MINER);
    }

    return status.production.grid + DELTA < 0 &&
      !container.some((c) => c.containerName === JobName.MONERO_MINER)
      ? (async () => this.dispatchReady(client, JobName.MONERO_MINER))()
      : Promise.resolve();
  }

  private async addWorkingStatusToLogs(client: WebSocket, working: boolean) {
    await this.handleContainerStatusInsertToDB(
      {
        containerName: StandardContainerNames.MAIN,
        statusCode: 0,
        statusMsg: working ? 'Working' : 'Connected',
      },
      client,
    );
  }

  async sendConfig(cuid: string, pluginName: PluginName, config: object) {
    try {
      const donationBoxId = await this.getDonationBoxIdByCuid(cuid);
      const client = [...this.authorizedClients.entries()].find(
        (entry) => entry[1] === donationBoxId,
      );
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      const [ws] = client;

      const plugin = await this.prismaService.supportedPowerSupply.findUnique({
        where: {
          name: pluginName,
        },
      });

      ws.send(
        formatMessage('addConfigurationRequest', {
          plugin_image_name: plugin.imageUri,
          plugin_configuration: config,
        }),
      );

      await this.prismaService.container.upsert({
        where: {
          name_donationBoxId: {
            name: StandardContainerNames.SOLAR_PLUGIN,
            donationBoxId,
          },
        },
        create: {
          name: StandardContainerNames.SOLAR_PLUGIN,
          donationBox: {
            connect: {
              id: donationBoxId,
            },
          },
          status: {
            create: {
              statusCode: SolarStatusCodes.PENDING,
              statusMsg: SolarStatusMessages[SolarStatusCodes.PENDING],
            },
          },
        },
        update: {
          status: {
            create: {
              statusCode: SolarStatusCodes.PENDING,
              statusMsg: SolarStatusMessages[SolarStatusCodes.PENDING],
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error when sending config. The donation box might have saved the config even though. ',
        error,
      );
    }
  }

  async sendStatusUpdateRequest(cuid: string) {
    const donationBoxId = await this.getDonationBoxIdByCuid(cuid);
    const client = [...this.authorizedClients.entries()].find(
      (entry) => entry[1] === donationBoxId,
    );
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const [ws] = client;

    ws.send(formatMessage('statusUpdateRequest', {}));
  }

  async handleContainerStatusInsertToDB(
    statusDto: ContainerStatusDto,
    client: WebSocket,
  ) {
    const { statusCode, statusMsg, containerName } = statusDto;
    return this.prismaService.container.upsert({
      where: {
        name_donationBoxId: {
          name: containerName,
          donationBoxId: this.authorizedClients.get(client),
        },
      },
      update: {
        status: {
          create: {
            statusCode,
            statusMsg,
          },
        },
      },
      create: {
        name: containerName,
        donationBox: {
          connect: {
            id: this.authorizedClients.get(client),
          },
        },
        status: {
          create: {
            statusCode,
            statusMsg,
          },
        },
      },
    });
  }
}
