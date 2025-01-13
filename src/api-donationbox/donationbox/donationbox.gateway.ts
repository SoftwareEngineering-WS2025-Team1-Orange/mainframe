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

  afterInit(_server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(_client: WebSocket) {
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
    const authenticated = await this.donationboxService.verifyClient(
      client,
      payload,
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
      const errorAuth = formatMessage('authResponse', {
        success: false,
        monitored_containers: [],
      });
      client.send(errorAuth);
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
    if (!this.donationboxService.isAuthorizedClient(client)) {
      return;
    }
    const { power_supply: powerSupply, container } = payload;
    await this.donationboxService.handleContainerStatusResponse(
      client,
      container,
    );
    if (powerSupply) {
      await this.donationboxService.handlePowerSupplyStatusResponse(
        client,
        powerSupply,
      );
    }
  }

  @SubscribeMessage('addErrorResponse')
  async handeAddErrorResponseEvent(
    client: WebSocket,
    payload: ContainerStatusDto,
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) {
      return;
    }
    await this.donationboxService.handleContainerStatusInsertToDB(
      payload,
      client,
    );
  }
}
