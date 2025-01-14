import { Expose, Exclude, Type } from 'class-transformer';
import { PayoutTypeEnum } from '@prisma/client';
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

export class ReturnEarningsDonationBoxDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  cuid: string;

  @Exclude()
  earningsLastSuccessfullUpdateAt: Date;

  @Exclude()
  earningsLastUpdateSuccessfull: boolean;

  @Exclude()
  donatorId: number;

  @Exclude()
  powerSupplyId: number;

  @Exclude()
  integratedPublicMoneroAddress: string;

  @Exclude()
  integratedPublicMoneroAddressId: string;

  constructor(partial: Partial<ReturnEarningsDonationBoxDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnMoneroMiningPayoutDto {
  @Expose()
  timestamp: Date;

  @Expose()
  periodStart: Date;
}

export class ReturnTransactionEarningDto {
  @Expose()
  id: number;

  @Expose()
  amountInCent: number;

  @Expose()
  payoutTimestamp: Date;

  @Expose()
  payoutType: PayoutTypeEnum;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  donationBoxId: number;

  @Expose()
  @Type(() => ReturnEarningsDonationBoxDto)
  donationBox: ReturnEarningsDonationBoxDto;

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
