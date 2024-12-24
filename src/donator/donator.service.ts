import { HttpException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Donation, Donator, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDonatorDto, RegisterDonationBoxDto } from './dto';
import { Pagination } from '@/utils/pagination.service';
import { getSortType, SortType } from '@/utils/sort_filter.service';
import {DonationFilter} from "@/donator/donator.filter.interface";

@Injectable()
export class DonatorService {
  constructor(private prismaService: PrismaService) {}

  async findDonatorById(id: number): Promise<Donator> {
    const donator = await this.prismaService.donator.findFirst({
      where: {
        id,
      },
    });

    if (!donator) {
      throw new HttpException('Donator not found', StatusCodes.NOT_FOUND);
    }

    return donator;
  }

  async createDonator(donator: CreateDonatorDto): Promise<Donator> {
    const salt = randomBytes(16).toString('hex');
    const donatorWithHash = {
      ...donator,
      password: await argon2.hash(donator.password + salt),
    };

    const newDonator = await this.prismaService.donator.create({
      data: {
        ...donatorWithHash,
        salt,
      },
    });

    return newDonator;
  }

  async registerDonationBox(
    donatorId: number,
    donationBox: RegisterDonationBoxDto,
  ) {
    await this.prismaService.donationBox.update({
      where: {
        CUID: donationBox.cuid,
      },
      data: {
        last_status: 'AVAILABLE',
        donatorId,
      },
    });
  }

  async findDonatorsDonationboxes(donatorId: number) {
    return this.prismaService.donationBox.findMany({
      where: {
        donatorId,
      },
    });
  }

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
