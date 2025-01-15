import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Donator, DonatorScopeEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateDonatorDto, UpdateDonatorDto } from '@/api-donator/donator/dto';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { DonatorWithScope } from '@/api-donator/auth/types';
import { DonatorFilter } from '@/shared/filters/donator.filter.interface';
import { EarningService } from '@/shared/services/earning.service';

@Injectable()
export class DonatorService {
  constructor(
    private prismaService: PrismaService,
    private earningService: EarningService,
  ) {}

  async findDonatorByIdWithBalance(
    id: number,
    forceRecalculation: boolean = false,
  ): Promise<Donator & { balance: number }> {
    const [, donator] = await Promise.all([
      this.earningService.updateEarningsForDonator(id, forceRecalculation),
      this.findDonatorById(id),
    ]);
    const balance = await this.calculateDonatorBalance(id);
    return { ...donator, balance };
  }

  async findDonatorById(id: number): Promise<Donator> {
    const donator = await this.prismaService.donator.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!donator) {
      throw new NotFoundException('Donator not found');
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
        deletedAt: null,
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
      where: { ...whereInputObject, deletedAt: null },
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

  async createDonator(
    donator: CreateDonatorDto,
  ): Promise<Donator & { balance: number }> {
    const salt = this.createSalt();
    const donatorWithHash = {
      ...donator,
      password: await argon2.hash(donator.password + salt),
    };

    const defaultRoles = Object.values(DonatorScopeEnum);

    const newDonator = await this.prismaService.donator.create({
      data: {
        ...donatorWithHash,
        salt,
        scope: {
          connect: defaultRoles.map((scope) => ({ name: scope })),
        },
      },
    });
    return {
      ...newDonator,
      balance: 0,
    };
  }

  async updateDonator(
    id: number,
    donator: UpdateDonatorDto,
  ): Promise<Donator & { scope: DonatorScopeEnum[]; balance: number }> {
    const salt = this.createSalt();

    const donatorWithHash = {
      ...donator,
      ...(donator.password != null
        ? { password: await argon2.hash(donator.password + salt), salt }
        : {}),
    };

    const updatedDonator = await this.prismaService.donator
      .update({
        where: {
          id,
          deletedAt: null,
        },
        data: donatorWithHash,
        include: { scope: true },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException('Donator not found.');
        }
        throw new InternalServerErrorException(
          'Something went wrong updating the Donator.',
        );
      });

    return {
      ...updatedDonator,
      balance: await this.calculateDonatorBalance(id),
      scope: updatedDonator.scope.map((scope) => scope.name),
    };
  }

  async deleteDonator(id: number): Promise<void> {
    // Check balance is 0 before allowing deletion
    const balance = await this.calculateDonatorBalance(id);
    if (balance > 0) {
      throw new BadRequestException(
        'Cannot delete donator with remaining balance. Please spend all funds before deletion.',
      );
    }
    // allow soft delete if donator has no balance and no boxes are associated with them (we assume unregistering and returning boxes is done via customer support in MVP)
    await this.prismaService.donator
      .update({
        where: {
          id,
          deletedAt: null,
          donationBox: { none: {} },
        },
        data: {
          deletedAt: new Date(Date.now()),
          refreshToken: null,
          firstName: `Deleted-${id}`,
          lastName: `Deleted-${id}`,
          email: `Deleted-${id}`,
        },
        include: {
          scope: true,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException(
            'Donator not found ready for deletion. Either he does not exist, is already deleted or still has donation boxes associated with him.',
          );
        } else if (error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException(
          'Something went wrong deleting the Donator.',
        );
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

  async calculateDonatorBalance(donatorId: number): Promise<number> {
    const earnings = await this.prismaService.earning.aggregate({
      _sum: {
        amountInCent: true,
      },
      where: {
        donationBox: {
          donatorId,
        },
      },
    });

    const donations = await this.prismaService.donation.aggregate({
      _sum: {
        amountInCent: true,
      },
      where: {
        donatorId,
      },
    });

    return (
      // eslint-disable-next-line no-underscore-dangle
      (earnings._sum.amountInCent || 0) - (donations._sum.amountInCent || 0)
    );
  }

  private createSalt(): string {
    return randomBytes(16).toString('hex');
  }
}
