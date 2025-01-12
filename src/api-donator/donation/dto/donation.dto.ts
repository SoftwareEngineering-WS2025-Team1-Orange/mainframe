import { IsInt, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';
import { ReturnTransactionDonationDto } from '@/api-donator/transaction/dto';

export class CreateDonationDto {
  @IsInt()
  @IsPositive()
  amountInCent: number;

  constructor(partial: Partial<CreateDonationDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnDonationDto extends ReturnTransactionDonationDto {
  @Expose()
  newBalance: number;
}
