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
import { StandardContainerNames } from '@/shared/services/types/StandardContainerNames';

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
        `Received invalid data format from DonationBox with id: ${clientId}. Dto: ${JSON.stringify(dtoInstance)}. Errors: ${JSON.stringify(errors)}`,
      );
      client.close();
      return null;
    }
    return dtoInstance;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(_server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(_client: WebSocket) {
    this.logger.log('Client connected');
  }

  async handleDisconnect(client: WebSocket) {
    if (this.donationboxService.authorizedClients.has(client)) {
      await this.donationboxService.handleContainerStatusInsertToDB(
        {
          containerName: StandardContainerNames.MAIN,
          statusCode: 1,
          statusMsg: 'Disconnected',
        },
        client,
      );
      this.donationboxService.removeAuthorizedClient(client);
    }
  }

  @SubscribeMessage('authRequest')
  async handleAuthRequestEvent(
    client: WebSocket,
    payload: JwtDonationBoxDto,
  ): Promise<void> {
    const jwtDto = await this.validateDto(client, payload, JwtDonationBoxDto);
    if (!jwtDto) return;

    const authenticated = await this.donationboxService.verifyClient(
      client,
      jwtDto,
    );

    if (authenticated) {
      await this.donationboxService.handleContainerStatusInsertToDB(
        {
          containerName: StandardContainerNames.MAIN,
          statusCode: 0,
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

    if (validatedContainers.some((containerStatus) => !containerStatus)) return;

    let validPowerSupply;
    if (powerSupply) {
      validPowerSupply = await this.validateDto(
        client,
        powerSupply,
        DonationBoxPowerSupplyStatusDto,
      );
      if (!validPowerSupply) return;
    }

    await this.donationboxService.handleContainerStatusResponse(
      client,
      validatedContainers,
    );
    await this.donationboxService.handlePowerSupplyStatusResponse(
      client,
      validatedContainers,
      validPowerSupply,
    );
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
    if (!containerDto) return;
    await this.donationboxService.handleContainerStatusInsertToDB(
      containerDto,
      client,
    );
  }
}
