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
import { DonationboxService } from '@/donationbox/donationbox.service';
import { JwtDonationBoxDto, DonationBoxStatusDto } from './dto';

@WebSocketGateway({ version: 1, path: '/api/v1/donationbox' })
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

  handleDisconnect(client: WebSocket) {
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
    payload: DonationBoxStatusDto,
  ): Promise<void> {
    if (!this.donationboxService.isAuthorizedClient(client)) {
      return null;
    }
    const { status } = payload;
    await this.donationboxService.handleStatusResponse(client, status);
    return null;
  }
}
