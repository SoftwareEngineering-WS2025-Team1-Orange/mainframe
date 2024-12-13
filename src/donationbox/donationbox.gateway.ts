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
import { JwtDonationBoxDto } from '@/donationbox/dto/jwt.dto';

@WebSocketGateway(3001)
export default class DonationboxGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DonationboxGateway.name);

  constructor(private readonly donationboxService: DonationboxService) {}

  @WebSocketServer()
  server: Server;

  list: WebSocket[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: WebSocket) {}

  handleDisconnect(client: WebSocket) {
    this.list = this.list.filter((item) => item !== client);
  }

  @SubscribeMessage('authRequest')
  async handleMessage(
    client: WebSocket,
    payload: JwtDonationBoxDto,
  ): Promise<void> {
    const token = await this.donationboxService.verifyToken(payload);
    if (!token) {
      client.send('Unauthorized');
      client.close();
      return null;
    }
    client.send('Authorized');
    client.send('Send Status');
    this.list.push(client);
    return null;
  }

  @SubscribeMessage('statusResponse')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleFollowUp(client: WebSocket, payload: string): Promise<void> {
    if (!this.list.includes(client)) {
      client.send('Unauthorized');
      client.close();
      return null;
    }
    client.send('Success');
    return null;
  }
}
