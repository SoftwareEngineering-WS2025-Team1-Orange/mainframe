import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Donation, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { DonationFilter, DonationIncludePartialRelations } from '@/shared/filters/donation.filter.interface';
import { DonatorService } from '@/shared/services/donator.service';
import { InsufficientBalanceError } from '@/shared/errors/InsufficientBalanceError';
import { NegativeAmountError } from '@/shared/errors/NegativeAmountError';
import { DonationWithPartialRelations } from './types/DonationWithPartialRelations';

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
    return this.findFilteredDonationsWithPartialRelations(
      filters,
      { donator: false, ngo: false, project: false },
      paginate,
    );
  }

  async findFilteredDonationsWithPartialRelations(
    filters: DonationFilter,
    includePartialRelations: DonationIncludePartialRelations,
    paginate: boolean = true,
  ): Promise<{
    donations: DonationWithPartialRelations[];
    pagination: Pagination;
  }> {
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
        project: includePartialRelations.project
          ? {
              select: {
                name: true,
                id: true,
              },
            }
          : undefined,
        ngo: includePartialRelations.ngo
          ? {
              select: {
                name: true,
                id: true,
              },
            }
          : undefined,
        donator: includePartialRelations.donator
          ? {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            }
          : undefined,
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
  ): Promise<DonationWithPartialRelations & { newBalance: number }> {
    try {
      const ngo = await this.prismaService.nGO.findFirstOrThrow({
        select: {
          id: true,
        },
        where: {
          projects: {
            some: {
              id: projectId,
            },
          },
        },
      });
      const donation = await this.createDonation(
        donatorId,
        ngo.id,
        amount,
        projectId,
      );
      return {
        ...donation,
        newBalance:
          await this.donatorService.calculateDonatorBalance(donatorId),
      };
    } catch (error) {
      const errorEnriched =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? new NotFoundException(
              'Failed to create donation because the project either not exists or is not linked to an ngo.',
            )
          : new InternalServerErrorException('Failed to create Donation.');
      throw errorEnriched;
    }
  }

  async createDonationToNgo(
    donatorId: number,
    ngoId: number,
    amount: number,
  ): Promise<Donation & { newBalance: number }> {
    return this.createDonation(donatorId, ngoId, amount, null);
  }

  private async createDonation(
    donatorId: number,
    ngoId: number,
    amount: number,
    projectId?: number,
  ): Promise<Donation & { newBalance: number }> {
    try {
      if (amount <= 0) {
        throw new NegativeAmountError('Donation amount must be positive');
      }
      const [donation, newBalance] = await this.prismaService.$transaction(
        async (prisma) => {
          const createdDonation = await prisma.donation.create({
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
          const danglingNewBalance =
            (await this.donatorService.calculateDonatorBalance(donatorId)) -
            amount;
          if (danglingNewBalance < 0) {
            throw new InsufficientBalanceError('Insufficient balance');
          }
          return [createdDonation, danglingNewBalance];
        },
      );
      const donationObject =
        await this.findFilteredDonationsWithPartialRelations(
          { filterId: donation.id },
          { donator: false, ngo: true, project: true },
        );
      return { ...donationObject.donations[0], newBalance };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException(
          'Either donator, ngo or project was not found.',
        );
      } else if (
        error instanceof InsufficientBalanceError ||
        error instanceof NegativeAmountError
      ) {
        throw new BadRequestException(
          'Failed to create donation. The donation amount must be positive and the donators balance sufficient.',
          error,
        );
      } else {
        throw new InternalServerErrorException(
          `Failed to create donation.`,
          error,
        );
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
