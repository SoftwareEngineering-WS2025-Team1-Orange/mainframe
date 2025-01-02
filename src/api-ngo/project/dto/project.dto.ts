import { Expose, Type, Exclude } from 'class-transformer';
import { Category, Project } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';

export class ReturnProjectNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

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

export class ReturnProjectDto {
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
  category: string;

  @Exclude()
  ngoId?: number;

  @Expose()
  ngo?: ReturnProjectNgoDto;

  @Expose()
  isFavorite: boolean;

  constructor(partial: Partial<ReturnProjectDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnPaginatedProjectsDto {
  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnPaginationDto;

  @Expose()
  @Type(() => ReturnProjectDto)
  projects: Project[];
}
