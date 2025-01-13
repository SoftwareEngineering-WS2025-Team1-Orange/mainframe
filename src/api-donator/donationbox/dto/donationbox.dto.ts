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
  power_consumption?: number;

  @Expose()
  power_supply_id?: number;

  @Exclude()
  donatorId: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<DonationBoxDto>) {
    Object.assign(this, partial);
  }
}
