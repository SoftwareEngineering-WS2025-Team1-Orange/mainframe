import { Injectable } from '@nestjs/common';
import { Donation, Earning } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';
import { DonationService } from '@/shared/services/donation.service';
import { EarningService } from '@/shared/services/earning.service';
import { BaseFilter } from '@/shared/filters/base.filter.interface';

@Injectable()
export class TransactionService {
  constructor(
    private prismaService: PrismaService,
    private donationService: DonationService,
    private earningsService: EarningService,
  ) {}

  private transactionType = {
    Earning: 'E',
    Donation: 'D',
  };

  async findFilteredTransactions(
    earningFilters: EarningFilter,
    donationFilters: DonationFilter,
    baseFilter: BaseFilter,
    forceEarningsUpdate: boolean = false,
  ): Promise<{
    donations: Donation[];
    earnings: Earning[];
    pagination: Pagination;
  }> {
    const donationsResult = await this.donationService.findFilteredDonations(
      { ...donationFilters, ...baseFilter }, // Use pagination and sort from baseFilter
      false,
    );
    const earningsResult = await this.earningsService.findFilteredEarnings(
      { ...earningFilters, ...baseFilter }, // Use pagination and sort from baseFilter
      false,
      forceEarningsUpdate,
    );

    const donationsWithType = donationsResult.donations.map((donation) => ({
      ...donation,
      type: this.transactionType.Donation,
    }));
    const earningsWithType = earningsResult.earnings.map((earning) => ({
      ...earning,
      type: this.transactionType.Earning,
    }));

    const combinedResults: ((Donation | Earning) & { type: string })[] =
      this.combineAndSortResults(
        donationsWithType,
        earningsWithType,
        baseFilter,
      );

    const pagination = new Pagination(
      donationsResult.pagination.totalResults +
        earningsResult.pagination.totalResults,
      donationsResult.pagination.filteredResults +
        earningsResult.pagination.filteredResults,
      baseFilter.paginationPageSize,
      baseFilter.paginationPage,
    );

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const paginatedResults: ((Donation | Earning) & { type: string })[] =
      combinedResults.slice(startIndex, startIndex + pagination.pageSize);

    const paginatedDonations: Donation[] = paginatedResults
      .filter((result) => result.type === 'D')
      .map(({ type, ...rest }) => rest as Donation);
    const paginatedEarnings: Earning[] = paginatedResults
      .filter((result) => result.type === 'E')
      .map(({ type, ...rest }) => rest as Earning);

    return {
      earnings: paginatedEarnings,
      donations: paginatedDonations,
      pagination,
    };
  }

  private combineAndSortResults(
    donations: Donation[],
    earnings: Earning[],
    baseFilter: BaseFilter,
  ): ((Donation | Earning) & { type: string })[] {
    const donationsWithType = donations.map((donation) => ({
      ...donation,
      type: this.transactionType.Donation,
    }));
    const earningsWithType = earnings.map((earning) => ({
      ...earning,
      type: this.transactionType.Earning,
    }));

    const combinedResults = [...donationsWithType, ...earningsWithType];
    combinedResults.sort((a, b) => {
      const fieldA: Date | number = a[this.getSortField(baseFilter.sortFor)] as
        | Date
        | number; // created_at or amount
      const fieldB: Date | number = b[this.getSortField(baseFilter.sortFor)] as
        | Date
        | number; // created_at or amount
      if (fieldA < fieldB)
        return getSortType(baseFilter.sortType) === (SortType.ASC as string)
          ? -1
          : 1;
      if (fieldA > fieldB)
        return getSortType(baseFilter.sortType) === (SortType.ASC as string)
          ? 1
          : -1;
      return 0;
    });

    return combinedResults;
  }

  private getSortField(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'amount':
        return 'amount';
      default:
        return 'createdAt';
    }
  }
}
