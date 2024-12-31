import { Exclude, Expose, Type } from 'class-transformer';
import { DonatorScope, NGO } from '@prisma/client';
import { ReturnPaginationDto } from '@/utils/pagination/dto/pagination.dto';

export class ReturnNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  website_url: string;

  @Expose()
  banner_uri: string;

  @Expose()
  description: string;

  @Expose()
  address: string;

  @Expose()
  contact: string;

  @Expose()
  isFavorite: boolean;

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
