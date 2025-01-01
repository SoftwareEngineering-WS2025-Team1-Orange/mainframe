import { HttpException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Donator, DonatorScopeEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  CreateDonatorDto,
} from '@/api-donator/donator/dto';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { DonatorWithScope } from '@/api-donator/auth/types';
import { DonatorFilter } from '@/shared/filters/donator.filter.interface';

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

  async updateRefreshToken(id: number, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await argon2.hash(refreshToken)
      : null;
    await this.prismaService.donator.update({
      where: {
        id,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async findFilteredDonator(
    filters: DonatorFilter,
  ): Promise<{ donators: DonatorWithScope[]; pagination: Pagination }> {
    const whereInputObject: Prisma.DonatorWhereInput = {
      AND: [
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterMail
          ? { email: { contains: filters.filterMail, mode: 'insensitive' } }
          : {},
        filters.filterFirstName
          ? {
              firstName: {
                contains: filters.filterFirstName,
                mode: 'insensitive',
              },
            }
          : {},
        filters.filterLastName
          ? {
              lastName: {
                contains: filters.filterLastName,
                mode: 'insensitive',
              },
            }
          : {},
      ],
    };

    const numTotalResults = await this.prismaService.donator.count();
    const numFilteredResults = await this.prismaService.donator.count({
      where: { ...whereInputObject },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      filters.paginationPageSize,
      filters.paginationPage,
    );
    const donators = await this.prismaService.donator.findMany({
      where: { ...whereInputObject },
      include: {
        scope: true,
      },
      ...pagination.constructPaginationQueryObject(),
      orderBy: { [this.getSortField(filters.sortFor)]: filters.sortType },
    });
    return {
      donators,
      pagination,
    };
  }

  async createDonator(donator: CreateDonatorDto): Promise<Donator> {
    const salt = randomBytes(16).toString('hex');

    const donatorWithHash = {
      ...donator,
      password: await argon2.hash(donator.password + salt),
    };

    const defaultRoles = [DonatorScopeEnum.NOT_IMPLEMENTED];

    const newDonator = await this.prismaService.donator.create({
      data: {
        ...donatorWithHash,
        salt,
        scope: {
          connectOrCreate: defaultRoles.map((scope) => ({
            where: { name: scope },
            create: { name: scope },
          })),
        },
      },
    });

    return newDonator;
  }

  private getSortField(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'email':
        return 'email';
      default:
        return 'id';
    }
  }
}
