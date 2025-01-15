import { IsNotEmpty, IsString } from 'class-validator';
import { Expose, Exclude } from 'class-transformer';

export class RegisterDonationBoxDto {
  @IsString()
  @IsNotEmpty()
  cuid: string;

  @IsString()
  @IsNotEmpty({ message: 'Name must have a value (can be empty string)' })
  name: string;
}

export class DonationBoxDto {
  @Expose()
  readonly id: number;

  @Expose()
  name: string;

  @Expose()
  readonly cuid: string;

  @Expose()
  lastSolarData?: JSON;

  @Expose()
  solarDataLastUpdateAt: Date;

  @Expose()
  averageWorkingTimePerDayInSeconds: number;

  @Expose()
  averageWorkingTimePerDayInSecondsLastUpdateAt: Date;

  @Expose()
  averageIncomePerDayInCents: number;

  @Expose()
  averageIncomePerDayLastUpdateAt: Date;

  @Expose()
  status: string;

  @Expose()
  earningsLastSuccessfullUpdateAt: Date;

  @Expose()
  earningsLastUpdateSuccessfull: boolean;

  @Exclude()
  donatorId: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  integratedPublicMoneroAddress: string;

  @Exclude()
  integratedPublicMoneroAddressId: string;

  constructor(partial: Partial<DonationBoxDto>) {
    Object.assign(this, partial);
  }
}
