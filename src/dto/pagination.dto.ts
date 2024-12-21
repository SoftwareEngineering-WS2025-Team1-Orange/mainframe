import { Expose } from 'class-transformer';

export class ReturnPaginationDto {
  @Expose()
  totalResults: number;

  @Expose()
  filteredResults: number;

  @Expose()
  currentPage: number;

  @Expose()
  numberOfPages: number;

  constructor(partial: Partial<ReturnPaginationDto>) {
    Object.assign(this, partial);
  }
}
