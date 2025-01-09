import { IsNumber, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';
import { ReturnTransactionDonationDto } from '@/api-donator/transaction/dto';

export class CreateDonationDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  constructor(partial: Partial<CreateDonationDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnDonationDto extends ReturnTransactionDonationDto {
  @Expose()
  newBalance: number;
}
