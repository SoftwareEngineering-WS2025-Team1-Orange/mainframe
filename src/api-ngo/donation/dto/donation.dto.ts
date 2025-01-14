import { IsNumber, IsPositive } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ReturnTransactionDonationDto } from '@/api-donator/transaction/dto';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';

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

export class ReturnNGODonationDto {
  @Expose()
  id: number;

  @Expose()
  amount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ReturnNGODonationDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnPaginatedDonationsDto {
  @Expose()
  @Type(() => ReturnDonationDto)
  donations: ReturnNGODonationDto[];

  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnNGODonationDto;

  constructor(partial: Partial<ReturnPaginatedDonationsDto>) {
    Object.assign(this, partial);
  }
}
