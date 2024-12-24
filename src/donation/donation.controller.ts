import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { ReturnPaginatedDonationsDto } from '@/donation/dto';
import { PaginationQueryArguments } from '@/utils/pagination.service';
import { getSortType, SortType } from '@/utils/sort_filter.service';
import { DonationFilter } from './donation.filter.interface';

@Controller('donation')
export class DonationController {
  constructor(private donationService: DonationService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedDonationsDto })
  @Get('/')
  getDonatorsDonations(
    @Query('donator_id', new ParseIntPipe({ optional: true })) donatorId: number,
    @Query('filter_id', new ParseIntPipe({ optional: true })) filterId?: number,
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterNgoId?: number,
    @Query('filter_ngo_name') filterNgoName?: string,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterProjectId?: number,
    @Query('filter_project_name') filterProjectName?: string,
    @Query('filter_created_from') filterCreatedFrom?: Date,
    @Query('filter_created_to') filterCreatedTo?: Date,
    @Query('filter_amount_from', new ParseIntPipe({ optional: true }))
    filterAmountFrom?: number,
    @Query('filter_amount_to', new ParseIntPipe({ optional: true }))
    filterAmountTo?: number,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
  ) {
    const normalizedSortType = getSortType(sortType, SortType.DESC);
    const filters: DonationFilter = {
      filterId,
      filterDonatorId: donatorId,
      filterNgoId,
      filterNgoName,
      filterProjectId,
      filterProjectName,
      filterCreatedFrom,
      filterCreatedTo,
      filterAmountFrom,
      filterAmountTo,
      paginationPage,
      paginationPageSize,
      sortFor,
      sortType: normalizedSortType,
    };
    return this.donationService.findFilteredDonations(filters);
  }
}
