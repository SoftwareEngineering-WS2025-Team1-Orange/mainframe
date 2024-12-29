import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { DonatorScope, Project } from '@prisma/client';
import { Optional } from '@nestjs/common';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';
import { ReturnProjectDto } from '@/api-donator/project/dto/project.dto';

class PaginatedProjects {
  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnPaginationDto;

  @Expose()
  @Type(() => ReturnProjectDto)
  projects: Project[];
}

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
  password: string;

  @Exclude()
  email: string;

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

  @Expose()
  @Type(() => PaginatedProjects)
  projects: PaginatedProjects;

  constructor(partial: Partial<ReturnNgoDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateNgoDto {
  @IsString()
  @Optional()
  name?: string;

  @IsString()
  @Optional()
  website_url?: string;

  @IsString()
  @Optional()
  description?: string;

  @IsString()
  @Optional()
  address?: string;

  @IsString()
  @Optional()
  contact?: string;

  @IsEmail()
  @Optional()
  email?: string;
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
