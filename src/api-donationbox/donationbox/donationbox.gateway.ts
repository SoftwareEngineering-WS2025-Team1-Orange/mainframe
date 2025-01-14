import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import {
  JwtDonationBoxDto,
  DonationBoxPowerSupplyStatusDto,
  ContainerStatusDto,
} from './dto';
import { formatMessage } from '@/utils/ws.helper';

@WebSocketGateway({ version: 1, path: '/api/v1/api-donationbox' })
export default class DonationboxGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DonationboxGateway.name);

  constructor(private readonly donationboxService: DonationboxService) {}

  @WebSocketServer()
  server: Server;

  private async validateDto<T extends object>(
    client: WebSocket,
    data: object,
    dto: new () => T,
  ): Promise<T> {
    const dtoInstance = plainToClass(dto, data);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      const clientId = this.donationboxService.authorizedClients.get(client);
      this.logger.error(
        `Received invalid data format from DonationBox with id: ${clientId}`,
      );
      this.donationboxService.removeAuthorizedClient(client);
      client.close();
    }
    return dtoInstance;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: WebSocket) {
    this.logger.log('Client connected');
  }

  async handleDisconnect(client: WebSocket) {
    await this.donationboxService.handleContainerStatusInsertToDB(
      {
        containerName: 'db-main',
        statusCode: 1,
        statusMsg: 'Disconnected',
      },
      client,
    );
    this.donationboxService.removeAuthorizedClient(client);
  }

  @SubscribeMessage('authRequest')
  async handleAuthRequestEvent(
    client: WebSocket,
    payload: JwtDonationBoxDto,
  ): Promise<void> {
    const jwtDto = await this.validateDto(client, payload, JwtDonationBoxDto);
    const authenticated = await this.donationboxService.verifyClient(
      client,
      jwtDto,
    );

    if (authenticated) {
      await this.donationboxService.handleContainerStatusInsertToDB(
        {
          containerName: 'db-main',
          statusCode: 1,
          statusMsg: 'Connected',
        },
        client,
      );
    } else {
      client.send(
        formatMessage('authResponse', {
          success: false,
          monitored_containers: [],
        }),
      );
      client.close();
    }
  }

  @SubscribeMessage('statusUpdateResponse')
  async handleStatusResponseEvent(
    client: WebSocket,
    payload: {
      time: string;
      power_supply?: DonationBoxPowerSupplyStatusDto;
      container: ContainerStatusDto[];
    },
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) return;

    const { power_supply: powerSupply, container } = payload;
    const validatedContainers = await Promise.all(
      container.map((status) =>
        this.validateDto(client, status, ContainerStatusDto),
      ),
    );

    if (powerSupply) {
      await this.validateDto(
        client,
        powerSupply,
        DonationBoxPowerSupplyStatusDto,
      );
    }

    await this.donationboxService.handleContainerStatusResponse(
      client,
      validatedContainers,
    );
    if (powerSupply) {
      await this.donationboxService.handlePowerSupplyStatusResponse(
        client,
        powerSupply,
        validatedContainers,
      );
    }
  }

  @SubscribeMessage('addErrorResponse')
  async handeAddErrorResponseEvent(
    client: WebSocket,
    payload: ContainerStatusDto,
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) return;
    const containerDto = await this.validateDto(
      client,
      payload,
      ContainerStatusDto,
    );
    await this.donationboxService.handleContainerStatusInsertToDB(
      containerDto,
      client,
    );
  }
}
