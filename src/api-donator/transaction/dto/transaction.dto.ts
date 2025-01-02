import { Expose, Exclude, Type } from 'class-transformer';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';

class ReturnDonationDonatorDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  constructor(partial: Partial<ReturnDonationDonatorDto>) {
    Object.assign(this, partial);
  }
}

class ReturnDonationNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  constructor(partial: Partial<ReturnDonationNgoDto>) {
    Object.assign(this, partial);
  }
}

class ReturnDonationProjectDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  constructor(partial: Partial<ReturnDonationProjectDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnTransactionDonationDto {
  @Expose()
  id: number;

  @Expose()
  amount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  ngo: ReturnDonationNgoDto;

  @Expose()
  project: ReturnDonationProjectDto;

  @Exclude()
  donator: ReturnDonationDonatorDto;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  ngoId: number;

  @Exclude()
  donatorId: number;

  @Exclude()
  projectId: number;

  constructor(partial: Partial<ReturnTransactionDonationDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnEarningsPayoutDto {
  @Exclude()
  id: number;

  @Exclude()
  amount: number;

  @Exclude()
  transactionHash: Date;

  @Expose()
  periodStart: Date;

  @Expose()
  periodEnd: Date;

  constructor(partial: Partial<ReturnEarningsPayoutDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnTransactionEarningDto {
  @Expose()
  id: number;

  @Expose()
  amount: number;

  @Expose()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Expose()
  activeInTimePeriod: number;

  @Expose()
  donationBoxId: number;

  @Exclude()
  payoutId: number;

  @Expose()
  payout: ReturnEarningsPayoutDto;

  constructor(partial: Partial<ReturnTransactionEarningDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnPaginatedTransactionsDto {
  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnPaginationDto;

  @Expose()
  @Type(() => ReturnTransactionDonationDto)
  donations: ReturnTransactionDonationDto[];

  @Expose()
  @Type(() => ReturnTransactionEarningDto)
  earnings: ReturnTransactionEarningDto[];
}
