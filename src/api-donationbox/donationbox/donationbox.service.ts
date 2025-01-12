import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { Status } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { formatMessage, formatError } from '@/utils/ws.helper';
import { MoneroIntegratedAddressService } from '@/utils/integrated_address_generator/monero_integrated_key.service';
import { MoneroIntegratedPublicAddress } from '@/utils/integrated_address_generator/types';
import {
  DonationBoxDtoResponse,
  JwtDonationBoxDto,
  JwtDonationBoxDtoResponse,
} from '@/api-donationbox/donationbox/dto';

@Injectable()
export class DonationboxService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
    private moneroIntegratedKeyService: MoneroIntegratedAddressService,
  ) {}

  async initNewDonationBox(): Promise<DonationBoxDtoResponse> {
    try {
      const cuid = createId();
      const moneroIntegratedPublicAddress: MoneroIntegratedPublicAddress =
        await this.moneroIntegratedKeyService.generateIntegratedAddress();
      await this.prismaService.donationBox.create({
        data: {
          cuid,
          last_status: 'UNINITIALIZED',
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
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      },
    );
    return { token };
  }

  authorizedClients: Map<WebSocket, string> = new Map();

  private addAuthorizedClient(client: WebSocket, cuid: string) {
    client.send(formatMessage('authResponse', { message: 'Authorized' }));
    client.send(formatMessage('statusRequest', { message: 'Send status' }));
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

  async verifyClient(
    client: WebSocket,
    token_wrapper: JwtDonationBoxDto,
  ): Promise<string | null> {
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

    // Check if donation box is active
    const donationbox = await this.prismaService.donationBox.findFirst({
      where: {
        cuid,
      },
    });

    const status = ['UNAVAILABLE', 'UNINITIALIZED'];
    if (!donationbox || status.includes(donationbox.last_status)) {
      return null;
    }

    return token;
  }

  private async dispatchReady(client: WebSocket) {
    return client.send(formatMessage('jobRequest', { message: 'Ready' }));
  }

  async handleStatusResponse(client: WebSocket, status: Status) {
    await this.prismaService.donationBox.update({
      where: {
        cuid: this.authorizedClients.get(client),
      },
      data: {
        last_status: status,
      },
    });

    if (status === Status.READY) {
      await this.dispatchReady(client);
    }
  }
}
