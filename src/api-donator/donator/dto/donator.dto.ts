import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

import { Exclude, Expose } from 'class-transformer';
import { DonatorScope } from '@prisma/client';

export class ReturnDonatorDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  balance: number;

  @Exclude()
  password: string;

  @Exclude()
  salt: string;

  @Exclude()
  refreshToken: string | null;

  @Exclude()
  scope: DonatorScope[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<ReturnDonatorDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateDonatorDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  constructor(partial: Partial<UpdateDonatorDto>) {
    Object.assign(this, partial);
  }
}

export class CreateDonatorDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  password: string;
}
