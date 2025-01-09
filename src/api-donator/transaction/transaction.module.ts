import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransactionController } from './transaction.controller';
import { DonationService } from '@/shared/services/donation.service';
import { EarningService } from '@/shared/services/earning.service';
import { TransactionService } from '@/api-donator/transaction/transaction.service';
import { DonatorService } from '@/shared/services/donator.service';
import { MiningPoolApiClient } from '@/clients/miningpool-api/miningpool-api.client';
import { MiningPoolApiModule } from '@/clients/miningpool-api/miningpool-api.module';

@Module({
  controllers: [TransactionController],
  providers: [
    DonatorService,
    DonationService,
    EarningService,
    TransactionService,
    MiningPoolApiClient,
  ],
  imports: [HttpModule, MiningPoolApiModule],
})
export class TransactionModule {}
