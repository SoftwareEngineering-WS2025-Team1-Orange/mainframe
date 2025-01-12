import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Expose, Exclude } from 'class-transformer';
import { Status } from '@prisma/client';

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

  @IsEnum(Status)
  status: Status;

  @Expose()
  power_consumption?: number;

  @Expose()
  power_supply_id?: number;

  @Expose()
  last_status: Status;

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
