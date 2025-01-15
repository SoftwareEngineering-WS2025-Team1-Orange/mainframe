import { Expose, Transform, Type } from 'class-transformer';
import { Category } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ReturnPaginatedDonationsDto } from '@/api-ngo/donation/dto';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  fundraising_goal: number;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  target_date: Date;

  @IsEnum(Category)
  category: Category;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  progress?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  fundraising_goal?: number;
}

export class ReturnProjectWithoutFavDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  fundraising_goal: number;

  @Expose()
  fundraising_current: number;

  @Expose()
  fundraising_closed: boolean;

  @Expose()
  progress: number;

  @Expose()
  archived: boolean;

  @Expose()
  target_date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  category: Category;

  @Expose()
  ngoId: number;

  constructor(partial: Partial<ReturnProjectWithoutFavDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnProjectWithPaginatedDonations {
  @Expose()
  @Type(() => ReturnProjectWithoutFavDto)
  project: ReturnProjectWithoutFavDto;

  @Expose()
  @Type(() => ReturnPaginatedDonationsDto)
  donations: ReturnPaginatedDonationsDto;
}
