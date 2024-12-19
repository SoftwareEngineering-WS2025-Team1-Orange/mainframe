import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { Status } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';
import { formatMessage, formatError } from '@/utils/wshelper';
import {
  DonationBoxDtoResponse,
  JwtDonationBoxDto,
  JwtDonationBoxDtoResponse,
} from './dto';

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
        CUID: cuid,
        last_status: 'UNINITIALIZED',
      },
    });
    return { cuid };
  }

  async generateToken(cuid: string): Promise<JwtDonationBoxDtoResponse> {
    const token = await this.jwtService.signAsync(
      { cuid },
      {
        secret: this.configService.get('JWT_SECRET'),
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
        secret: this.configService.get('JWT_SECRET'),
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
        CUID: cuid,
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
        CUID: this.authorizedClients.get(client),
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
