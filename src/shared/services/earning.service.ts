import { Injectable } from '@nestjs/common';
import { Earning, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';

@Injectable()
export class EarningService {
  constructor(private prismaService: PrismaService) {}

  async findFilteredEarnings(
    filters: EarningFilter,
    paginate: boolean = true,
  ): Promise<{ earnings: Earning[]; pagination: Pagination }> {
    const whereInputObject: Prisma.EarningWhereInput = {
      AND: [
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterDonatorId != null
          ? { donationBox: { donatorId: filters.filterDonatorId } }
          : {},
        filters.filterDonationboxId != null
          ? { donationBoxId: filters.filterDonationboxId }
          : {},
        filters.filterCreatedFrom
          ? { createdAt: { gte: filters.filterCreatedFrom } }
          : {},
        filters.filterCreatedTo
          ? { createdAt: { lte: filters.filterCreatedTo } }
          : {},
        filters.filterAmountFrom
          ? { amount: { gte: filters.filterAmountFrom } }
          : {},
        filters.filterAmountTo
          ? { amount: { lte: filters.filterAmountTo } }
          : {},
      ],
    };

    const numTotalResults = await this.prismaService.earning.count();
    const numFilteredResults = await this.prismaService.earning.count({
      where: {
        ...whereInputObject,
      },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      paginate ? filters.paginationPageSize : numFilteredResults,
      paginate ? filters.paginationPage : 1,
    );
    const earnings = await this.prismaService.earning.findMany({
      where: {
        ...whereInputObject,
      },
      ...(paginate ? pagination.constructPaginationQueryObject() : {}),
      include: {
        payout: {
          select: {
            periodStart: true,
            periodEnd: true,
          },
        },
      },
      orderBy: {
        [this.getSortField(filters.sortFor)]: getSortType(
          filters.sortType,
          SortType.DESC,
        ),
      },
    });
    return { earnings, pagination };
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
