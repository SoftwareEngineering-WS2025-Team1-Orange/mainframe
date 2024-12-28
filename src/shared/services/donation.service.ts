import { Injectable } from '@nestjs/common';
import { Donation, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { DonationFilter } from '@/utils/donation.filter.interface';

@Injectable()
export class DonationService {
  constructor(private prismaService: PrismaService) {}

  async findFilteredDonations(
    filters: DonationFilter,
  ): Promise<{ donations: Donation[]; pagination: Pagination }> {
    const whereInputObject: Prisma.DonationWhereInput = {
      AND: [
        filters.filterId ? { id: filters.filterId } : {},
        filters.filterDonatorId ? { donatorId: filters.filterDonatorId } : {},
        filters.filterDonatorFirstName
          ? {
              donator: {
                firstName: {
                  contains: filters.filterDonatorFirstName,
                  mode: 'insensitive',
                },
              },
            }
          : {},
        filters.filterDonatorLastName
          ? {
              donator: {
                lastName: {
                  contains: filters.filterDonatorLastName,
                  mode: 'insensitive',
                },
              },
            }
          : {},
        filters.filterProjectId ? { projectId: filters.filterProjectId } : {},
        filters.filterProjectName
          ? {
              project: {
                name: {
                  contains: filters.filterProjectName,
                  mode: 'insensitive',
                },
              },
            }
          : {},
        filters.filterNgoId ? { project: { ngoId: filters.filterNgoId } } : {},
        filters.filterNgoName
          ? {
              project: {
                ngo: {
                  name: {
                    contains: filters.filterNgoName,
                    mode: 'insensitive',
                  },
                },
              },
            }
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

    const numTotalResults = await this.prismaService.donation.count();
    const numFilteredResults = await this.prismaService.donation.count({
      where: {
        ...whereInputObject,
      },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      filters.paginationPageSize,
      filters.paginationPage,
    );
    const donations = await this.prismaService.donation.findMany({
      where: {
        ...whereInputObject,
      },
      ...pagination.constructPaginationQueryObject(),
      include: {
        project: {
          select: {
            name: true,
            id: true,
          },
        },
        ngo: {
          select: {
            name: true,
            id: true,
          },
        },
        donator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    return { donations, pagination };
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
