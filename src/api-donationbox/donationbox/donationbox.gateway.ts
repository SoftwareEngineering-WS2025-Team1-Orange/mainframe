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
  DonationBoxContainerStatusDto,
  ContainerStatusDto,
} from './dto';

@WebSocketGateway({ version: 1, path: '/api/v1/api-donationbox' })
export default class DonationboxGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DonationboxGateway.name);

  constructor(private readonly donationboxService: DonationboxService) {}

  @WebSocketServer()
  server: Server;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: WebSocket) {
    this.logger.log('Client connected');
  }

  async handleDisconnect(client: WebSocket) {
    await this.donationboxService.handleContainerStatusInsertToDB({
      containerName: 'db-main',
      statusCode: 1,
      statusMsg: 'Disconnected',
    });
    this.donationboxService.removeAuthorizedClient(client);
  }

  @SubscribeMessage('authRequest')
  async handleAuthRequestEvent(
    client: WebSocket,
    payload: JwtDonationBoxDto,
  ): Promise<void> {
    await this.donationboxService.verifyClient(client, payload);
  }

  @SubscribeMessage('statusResponse')
  async handleStatusResponseEvent(
    client: WebSocket,
    payload: {
      time: string;
      power_supply: DonationBoxPowerSupplyStatusDto;
      container: DonationBoxContainerStatusDto;
    },
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) {
      return null;
    }
    const { power_supply: powerSupply, container } = payload;
    await this.donationboxService.handleContainerStatusResponse(
      client,
      container,
    );
    await this.donationboxService.handlePowerSupplyStatusResponse(
      client,
      powerSupply,
    );
    return null;
  }

  @SubscribeMessage('addErrorResponse')
  async handeAddErrorResponseEvent(
    client: WebSocket,
    payload: ContainerStatusDto,
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) {
      return null;
    }
    await this.donationboxService.handleContainerStatusInsertToDB(payload);
    return null;
  }
}
