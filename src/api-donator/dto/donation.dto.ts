import { Expose, Exclude, Type } from 'class-transformer';
import { ReturnPaginationDto } from '@/shared/dto/pagination.dto';

class ReturnDonationDonatorDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  Constructor(partial: Partial<ReturnDonationDonatorDto>) {
    Object.assign(this, partial);
  }
}

class ReturnDonationNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  Constructor(partial: Partial<ReturnDonationNgoDto>) {
    Object.assign(this, partial);
  }
}

class ReturnDonationProjectDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  Constructor(partial: Partial<ReturnDonationProjectDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnDonationDto {
  @Expose()
  id: number;

  @Expose()
  amount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  ngo: ReturnDonationNgoDto;

  @Expose()
  project: ReturnDonationProjectDto;

  @Exclude()
  donator: ReturnDonationDonatorDto;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  ngoId: number;

  @Exclude()
  donatorId: number;

  @Exclude()
  projectId: number;

  Constructor(partial: Partial<ReturnDonationDto>) {
    Object.assign(this, partial);
  }
}

export class ReturnPaginatedDonationsDto {
  @Expose()
  @Type(() => ReturnPaginationDto)
  pagination: ReturnPaginationDto;

  @Expose()
  @Type(() => ReturnDonationDto)
  donations: ReturnDonationDto[];
}
