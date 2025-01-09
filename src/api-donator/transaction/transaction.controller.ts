import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';
import { prefix } from '@/api-donator/prefix';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { TransactionService } from '@/api-donator/transaction/transaction.service';
import { ReturnPaginatedTransactionsDto } from '@/api-donator/transaction/dto/transaction.dto';

@Controller(`${prefix}/transaction`)
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedTransactionsDto })
  @Get('donator/:donator_id')
  getDonatorsTransactions(
    @Param('donator_id', ParseIntPipe)
    donatorId: number,
    @Query('filter_donation_ngo_id', new ParseIntPipe({ optional: true }))
    filterNgoId?: number,
    @Query('filter_donation_ngo_name') filterNgoName?: string,
    @Query('filter_donation_project_id', new ParseIntPipe({ optional: true }))
    filterProjectId?: number,
    @Query('filter_donation_project_name') filterProjectName?: string,
    @Query(
      'filter_earning_donationbox_id',
      new ParseIntPipe({ optional: true }),
    )
    filterDonationboxId?: number,
    @Query('filter_created_from') filterCreatedFrom?: Date,
    @Query('filter_created_to') filterCreatedTo?: Date,
    @Query('filter_amount_from', new ParseIntPipe({ optional: true }))
    filterAmountFrom?: number,
    @Query('filter_amount_to', new ParseIntPipe({ optional: true }))
    filterAmountTo?: number,
    @Query('force_earnings_update') forceEarningsUpdate?: boolean,
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
    const baseFilter = {
      paginationPage,
      paginationPageSize,
      sortFor,
      sortType: getSortType(sortType, SortType.DESC),
    };
    const donationFilters: DonationFilter = {
      filterDonatorId: donatorId,
      filterNgoId,
      filterNgoName,
      filterProjectId,
      filterProjectName,
      filterCreatedFrom,
      filterCreatedTo,
      filterAmountFrom,
      filterAmountTo,
      ...baseFilter,
    };
    const earningsFilters: EarningFilter = {
      filterDonatorId: donatorId,
      filterDonationboxId,
      filterCreatedFrom,
      filterCreatedTo,
      filterAmountFrom,
      filterAmountTo,
      ...baseFilter,
    };
    return this.transactionService.findFilteredTransactions(
      earningsFilters,
      donationFilters,
      baseFilter,
      forceEarningsUpdate,
    );
  }
}
