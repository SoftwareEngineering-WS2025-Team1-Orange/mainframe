import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '@/api-donator/transaction/transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
