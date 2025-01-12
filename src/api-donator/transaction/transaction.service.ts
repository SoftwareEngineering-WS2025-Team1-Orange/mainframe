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
import { DonationWithPartialRelations } from '@/shared/services/types/DonationWithPartialRelations';

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
    donations: DonationWithPartialRelations[];
    earnings: Earning[];
    pagination: Pagination;
  }> {
    const donationsResult =
      await this.donationService.findFilteredDonationsWithPartialRelations(
        {
          ...donationFilters,
          ...baseFilter,
          sortFor: this.getSortFieldDonation(baseFilter.sortFor),
        }, // Use pagination and sort from baseFilter
        { donator: false, ngo: true, project: true },
        false,
      );
    const earningsResult =
      await this.earningsService.findFilteredEarningsWithPartialRelations(
        {
          ...earningFilters,
          ...baseFilter,
          sortFor: this.getSortFieldEarning(baseFilter.sortFor),
        }, // Use pagination and sort from baseFilter
        { moneroMiningPayout: true, donationBox: true },
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

    const combinedResults: ((DonationWithPartialRelations | Earning) & {
      type: string;
    })[] = this.combineAndSortResults(
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
    const paginatedResults: ((DonationWithPartialRelations | Earning) & {
      type: string;
    })[] = combinedResults.slice(startIndex, startIndex + pagination.pageSize);

    const paginatedDonations: DonationWithPartialRelations[] = paginatedResults
      .filter((result) => result.type === 'D')
      .map(({ type, ...rest }) => rest as DonationWithPartialRelations);
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
    donations: DonationWithPartialRelations[],
    earnings: Earning[],
    baseFilter: BaseFilter,
  ): ((DonationWithPartialRelations | Earning) & { type: string })[] {
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
      const fieldA: Date | number =
        a.type === this.transactionType.Donation
          ? ((a as Donation)[this.getSortFieldDonation(baseFilter.sortFor)] as
              | Date
              | number)
          : ((a as Earning)[this.getSortFieldEarning(baseFilter.sortFor)] as
              | Date
              | number);
      const fieldB: Date | number =
        b.type === this.transactionType.Donation
          ? ((b as Donation)[this.getSortFieldDonation(baseFilter.sortFor)] as
              | Date
              | number)
          : ((b as Earning)[this.getSortFieldEarning(baseFilter.sortFor)] as
              | Date
              | number);
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

  private getSortFieldDonation(sortFor?: string): string {
    switch (sortFor) {
      case 'amount':
        return 'amountInCent';
      case 'created_at_or_timestamp':
      case 'created_at':
      default:
        return 'createdAt';
    }
  }

  private getSortFieldEarning(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'amount':
        return 'amountInCent';
      case 'payoutTimestamp':
      default:
        return 'payoutTimestamp';
    }
  }
}
