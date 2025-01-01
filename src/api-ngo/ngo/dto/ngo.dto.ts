import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsOptional,
} from 'class-validator';
import { DonatorScope, Project } from '@prisma/client';
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

export class ReturnNgoWithoutProjectsDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  website_url: string;

  @Expose()
  description: string;

  @Expose()
  banner_uri: string;

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

  @Expose()
  scope: DonatorScope[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<ReturnNgoWithoutProjectsDto>) {
    Object.assign(this, partial);
  }
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
  banner_uri: string;

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

  @Expose()
  scope: DonatorScope[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => PaginatedProjects)
  projects: PaginatedProjects;

  constructor(partial: Partial<ReturnNgoDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateNgoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  website_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsEmail()
  @IsOptional()
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
