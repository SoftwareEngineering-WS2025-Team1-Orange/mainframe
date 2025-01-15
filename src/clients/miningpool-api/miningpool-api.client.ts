import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { MiningPoolApiPayoutDto } from './miningpool-api.dto';

@Injectable()
export class MiningPoolApiClient {
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('MONERO_MINING_POOL_BASE_URL');

    if (!this.baseUrl) {
      throw new Error('MONERO_MINING_POOL_BASE_URL environment variable is not set');
    }
  }

  async getMiningPayouts(
    donationBoxId: number,
    fromDate?: Date,
  ): Promise<MiningPoolApiPayoutDto[]> {
    try {
      const box = await this.prismaService.donationBox.findFirstOrThrow({
        where: {
          id: donationBoxId,
        },
      });
      const walletPrivateKey = box.integratedPublicMoneroAddress;
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/${walletPrivateKey}/payments`),
      );
      let payouts: MiningPoolApiPayoutDto[] = plainToInstance(
        MiningPoolApiPayoutDto,
        Array.isArray(response.data) ? response.data : [response.data],
      );
      await Promise.all(payouts.map((payout) => validateOrReject(payout)));
      if (fromDate) {
        payouts = payouts.filter(
          (payout) => new Date(payout.ts * 1000) > fromDate,
        );
      }
      return payouts;
    } catch {
      throw new Error(`Failed to fetch mining payouts.`);
    }
  }
}
