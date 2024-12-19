import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { NGO } from '@prisma/client';
import { ReturnPaginationDto } from '@/dto/pagination.dto';

export class ReturnNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  website_url: string;

  @Expose()
  description: string;

  @Expose()
  address: string;

  @Expose()
  contact: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  email: string;

  @Exclude()
  salt: string;

  constructor(partial: Partial<ReturnNgoDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnPaginatedNgosDto {
  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnPaginationDto;

  @Expose()
  @Type(() => ReturnNgoDto)
  ngos: NGO[];
}

export class CreateNgoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  website_url: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

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
