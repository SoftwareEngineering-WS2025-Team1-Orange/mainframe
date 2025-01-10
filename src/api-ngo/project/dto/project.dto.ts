import { Expose, Type } from 'class-transformer';
import { Category } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
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

  @IsDate()
  target_date: Date;

  @IsEnum(Category)
  category: Category;
}

export class UpdateProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(Category)
  category: Category;

  @IsNumber()
  @IsPositive()
  fundraising_goal: number;
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
