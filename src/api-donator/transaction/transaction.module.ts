import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { DonationService } from '@/shared/services/donation.service';
import { EarningService } from '@/shared/services/earning.service';
import { TransactionService } from '@/api-donator/transaction/transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [DonationService, EarningService, TransactionService],
})
export class TransactionModule {}
