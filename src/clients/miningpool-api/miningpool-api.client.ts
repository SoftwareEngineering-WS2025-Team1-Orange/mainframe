import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { MiningPoolApiRewardDto } from './miningpool-api.dto';

@Injectable()
export class MiningPoolApiClient {
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('MINING_POOL_BASE_URL');

    if (!this.baseUrl) {
      throw new Error('MINING_POOL_BASE_URL environment variable is not set');
    }
  }

  async getMiningRewards(
    donationBoxId: number,
    fromDate?: Date,
  ): Promise<MiningPoolApiRewardDto[]> {
    try {
      const box = await this.prismaService.donationBox.findFirstOrThrow({
        where: {
          id: donationBoxId,
        },
      });
      const walletPrivateKey = box.integratedPublicAddress;
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/${walletPrivateKey}/rewards`),
      );
      let rewards: MiningPoolApiRewardDto[] = plainToInstance(
        MiningPoolApiRewardDto,
        Array.isArray(response.data) ? response.data : [response.data],
      );
      await Promise.all(rewards.map((reward) => validateOrReject(reward)));
      if (fromDate) {
        rewards = rewards.filter(
          (reward) => new Date(reward.ts * 1000) > fromDate,
        );
      }
      return rewards;
    } catch {
      throw new Error(`Failed to fetch mining rewards.`);
    }
  }
}
