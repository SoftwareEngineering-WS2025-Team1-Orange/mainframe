import {IsEnum, IsNotEmpty, IsString} from 'class-validator';
import {Expose, Exclude} from "class-transformer";
import {Status} from "@prisma/client";

export class RegisterDonationBoxDto {
  @IsString()
  @IsNotEmpty()
  cuid: string;
}

export class DonationBoxDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly cuid: string;

  @IsEnum(Status)
  status: Status;

  @Expose()
  power_consumption?: number;

  @Expose()
  power_supply_id?: number;

  @Exclude()
  donatorId: number

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}

