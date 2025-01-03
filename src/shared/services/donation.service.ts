import { Injectable } from '@nestjs/common';
import { Donation, Prisma } from '@prisma/client';
import { NotFoundError } from 'rxjs';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';
import { DonatorService } from '@/shared/services/donator.service';
import { InsufficientBalanceError } from '@/shared/errors/InsufficientBalanceError';

@Injectable()
export class DonationService {
  constructor(
    private prismaService: PrismaService,
    private donatorService: DonatorService,
  ) {}

  async findFilteredDonations(
    filters: DonationFilter,
    paginate: boolean = true,
  ): Promise<{ donations: Donation[]; pagination: Pagination }> {
    const whereInputObject: Prisma.DonationWhereInput = {
      AND: [
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterDonatorId != null
          ? { donatorId: filters.filterDonatorId }
          : {},
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
        filters.filterProjectId != null
          ? { projectId: filters.filterProjectId }
          : {},
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
        filters.filterNgoId != null
          ? { project: { ngoId: filters.filterNgoId } }
          : {},
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
      paginate ? filters.paginationPageSize : numFilteredResults,
      paginate ? filters.paginationPage : 1,
    );
    const donations = await this.prismaService.donation.findMany({
      where: {
        ...whereInputObject,
      },
      ...(paginate ? pagination.constructPaginationQueryObject() : {}),
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

  async createDonationToProject(
    donatorId: number,
    projectId: number,
    amount: number,
  ): Promise<Donation> {
    try {
      const ngo = await this.prismaService.nGO.findFirstOrThrow({
        where: {
          projects: {
            some: {
              id: projectId,
            },
          },
        },
      });
      return await this.createDonation(donatorId, amount, ngo.id, projectId);
    } catch {
      throw new Error('Failed to create donation to project');
    }
  }

  async createDonationToNgo(
    donatorId: number,
    ngoId: number,
    amount: number,
  ): Promise<Donation> {
    return this.createDonation(donatorId, ngoId, amount, null);
  }

  private async createDonation(
    donatorId: number,
    ngoId: number,
    amount: number,
    projectId?: number,
  ): Promise<Donation> {
    try {
      const donator = await this.prismaService.donator.findFirstOrThrow({
        where: {
          id: donatorId,
        },
      });
      if (donator.balance < amount) {
        throw new InsufficientBalanceError('Insufficient balance');
      } else if (amount <= 0) {
        throw new Error('Donation amount must be positive'); // TODO: Create new error type here
      }
      // If recalculating the balance fails, the transaction should be aborted and the donation deleted
      const donation = await this.prismaService.$transaction(async (prisma) => {
        const newDonation = await prisma.donation.create({
          data: {
            donator: {
              connect: {
                id: donatorId,
              },
            },
            ngo: {
              connect: {
                id: ngoId,
              },
            },
            project: projectId ? { connect: { id: projectId } } : undefined,
            amount,
          },
        });
        await this.donatorService.recalculateBalance(donatorId);
        return newDonation;
      });
      return donation;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundError('Donation record not found');
      } else if (error instanceof InsufficientBalanceError) {
        throw error;
      } else {
        throw new TypeError(`Failed to create donation.`);
      }
    }
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
