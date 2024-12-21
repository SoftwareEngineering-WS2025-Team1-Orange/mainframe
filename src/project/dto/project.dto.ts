import { Expose, Type } from 'class-transformer';
import { Project } from '@prisma/client';
import { ReturnPaginationDto } from '@/dto/pagination.dto';

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

  @Expose()
  ngoId?: number;

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
