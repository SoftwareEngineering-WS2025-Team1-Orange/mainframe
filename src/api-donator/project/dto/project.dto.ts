import { Expose, Type, Exclude } from 'class-transformer';
import { Project } from '@prisma/client';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';

export class ReturnProjectNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
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

  @Exclude()
  archived: boolean;

  @Expose()
  target_date: Date;

  @Expose()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Expose()
  category: string;

  @Exclude()
  ngoId?: number;

  @Expose()
  ngo?: ReturnProjectNgoDto;

  @Expose()
  is_favorite: boolean;

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
