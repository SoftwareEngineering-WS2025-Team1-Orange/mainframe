import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { formatMessage, formatError } from '@/utils/ws.helper';
import {
  ContainerStatusDto,
  DonationBoxContainerStatusDto,
  DonationBoxDtoResponse,
  DonationBoxPowerSupplyStatusDto,
  JwtDonationBoxDto,
  JwtDonationBoxDtoResponse,
} from '@/api-donationbox/donationbox/dto';

const DELTA = 20;

@Injectable()
export class DonationboxService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async initNewDonationBox(): Promise<DonationBoxDtoResponse> {
    const cuid = createId();
    await this.prismaService.donationBox.create({
      data: {
        cuid,
        name: null,
      },
    });
    return { cuid };
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

  authorizedClients: Map<WebSocket, string> = new Map();

  private addAuthorizedClient(client: WebSocket, cuid: string) {
    this.authorizedClients.set(client, cuid);
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

  async verifyClient(client: WebSocket, token_wrapper: JwtDonationBoxDto) {
    const token = await this.verifyToken(token_wrapper);

    if (!token) {
      client.send(
        formatError(
          'authResponse',
          StatusCodes.BAD_REQUEST,
          'The token is invalid',
        ),
      );
      client.close();
    }

    const { cuid }: { cuid: string } = this.jwtService.decode(token);

    this.addAuthorizedClient(client, cuid);

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
        monitored_containers: result,
      }),
    );

    client.send(
      formatMessage('startContainerRequest', {
        imageName: 'postgres',
        containerName: 'postgresMainframe',
        environmentVars: {
          postgres_password: 123,
          postgres_user: 'admin',
        },
      }),
    );
  }

  private async dispatchReady(client: WebSocket) {
    return client.send(formatMessage('jobRequest', { message: 'Ready' }));
  }

  async handleContainerStatusResponse(
    client: WebSocket,
    status: DonationBoxContainerStatusDto,
  ) {
    const logs = status.containerStatus.map(async (statusDto) =>
      this.handleContainerStatusInsertToDB(statusDto),
    );
    await Promise.all(logs);
  }

  async handlePowerSupplyStatusResponse(
    client: WebSocket,
    status: DonationBoxPowerSupplyStatusDto,
  ) {
    await this.prismaService.donationBox.update({
      where: {
        cuid: this.authorizedClients.get(client),
      },
      data: {
        lastSolarStatus: JSON.stringify(status),
      },
    });

    if (status.production.grid + DELTA >= 0) {
      return null;
    }

    return this.dispatchReady(client);
  }

  async sendConfig(cuid: string, config: object) {
    const client = [...this.authorizedClients.entries()].find(
      (entry) => entry[1] === cuid,
    );
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const [ws] = client;

    ws.send(formatMessage('addConfigurationRequest', { config }));

    return { message: 'Configuration sent' };
  }

  async handleContainerStatusInsertToDB(statusDto: ContainerStatusDto) {
    const { statusCode, statusMsg, containerName } = statusDto;

    const status = {
      create: {
        statusCode,
        statusMsg,
      },
    };

    return this.prismaService.container.upsert({
      where: {
        name: containerName,
      },
      update: {
        status,
      },
      create: {
        name: containerName,
        status,
      },
    });
  }
}
