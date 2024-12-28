import { HttpException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Donator, DonatorScopeEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/dto/donationbox.dto';
import { CreateDonatorDto } from '@/api-donator/dto/donator.dto';
import { Pagination } from '@/utils/pagination.service';
import { DonatorWithScope } from '@/api-donator/auth/types';

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
    filterId?: number,
    // filterIsFavorite: boolean = false,
    filterMail?: string,
    // filterDonatedTo: boolean = false,
    paginationPage: number = 1,
    paginationResultsPerPage: number = 10,
    sortType?: string,
    sortFor?: string,
  ): Promise<{ donators: DonatorWithScope[]; pagination: Pagination }> {
    const whereInputObject: Prisma.DonatorWhereInput = {
      AND: [
        filterId ? { id: filterId } : {},
        filterMail
          ? { email: { contains: filterMail, mode: 'insensitive' } }
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
      paginationResultsPerPage,
      paginationPage,
    );
    const donators = await this.prismaService.donator.findMany({
      where: { ...whereInputObject },
      include: {
        scope: true,
      },
      ...pagination.constructPaginationQueryObject(),
      orderBy: { [this.getSortField(sortFor)]: sortType },
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
