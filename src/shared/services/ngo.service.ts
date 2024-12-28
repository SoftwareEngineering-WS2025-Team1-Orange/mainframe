import { HttpException, Injectable } from '@nestjs/common';
import { NGO, NGOScopeEnum, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateNgoDto } from '@/api-ngo/ngo/dto/ngo.dto';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { NGOWithScope } from '@/api-ngo/auth/types';
import { NgoFilter } from '@/shared/filters/ngo.filter.interface';

@Injectable()
export class NgoService {
  constructor(private prismaService: PrismaService) {}

  async findNgoById(id: number): Promise<NGO> {
    const ngo = await this.prismaService.nGO.findFirst({
      where: {
        id,
      },
    });

    if (!ngo) {
      throw new HttpException('NGO not found', StatusCodes.NOT_FOUND);
    }
    return ngo;
  }

  async findFilteredNgosWithFavourite(
    filters: NgoFilter,
    favourizedByDonatorId: number,
  ): Promise<{
    ngos: (NGOWithScope & { isFavorite: boolean })[];
    pagination: Pagination;
  }> {
    const {
      ngos,
      pagination,
    }: { ngos: NGOWithScope[]; pagination: Pagination } =
      await this.findFilteredNgos(filters);

    const favorizedNgos = await this.prismaService.nGO.findMany({
      select: {
        id: true,
      },
      where: {
        favouritedByDonators: { some: { id: favourizedByDonatorId } },
      },
    });

    const favorizedNgoIDs: Set<number> = new Set(
      favorizedNgos.map((ngo) => ngo.id),
    );

    const ngosWithIsFavorite = ngos.map((ngo) => ({
      ...ngo,
      isFavorite: favorizedNgoIDs.has(ngo.id),
    }));
    return { ngos: ngosWithIsFavorite, pagination };
  }

  async findFilteredNgos(
    filters: NgoFilter,
  ): Promise<{ ngos: NGOWithScope[]; pagination: Pagination }> {
    const whereInputObject: Prisma.NGOWhereInput = {
      AND: [
        filters.filterId ? { id: filters.filterId } : {},
        filters.filterName
          ? { name: { contains: filters.filterName, mode: 'insensitive' } }
          : {},
        filters.filterMail
          ? { email: { contains: filters.filterMail, mode: 'insensitive' } }
          : {},
        filters.filterFavorizedByDonatorId
          ? {
              favouritedByDonators: {
                some: { id: filters.filterFavorizedByDonatorId },
              },
            }
          : {},
        filters.filterNotFavorizedByDonatorId
          ? {
              favouritedByDonators: {
                none: { id: filters.filterNotFavorizedByDonatorId },
              },
            }
          : {},
        filters.filterDonatedToByDonatorId
          ? {
              donations: {
                some: { donatorId: filters.filterDonatedToByDonatorId },
              },
            }
          : {},
        filters.filterNotDonatedToByDonatorId
          ? {
              donations: {
                none: { donatorId: filters.filterNotDonatedToByDonatorId },
              },
            }
          : {},
      ],
    };

    const numTotalResults = await this.prismaService.nGO.count();
    const numFilteredResults = await this.prismaService.nGO.count({
      where: { ...whereInputObject },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      filters.paginationPageSize,
      filters.paginationPage,
    );
    const ngos = await this.prismaService.nGO.findMany({
      where: { ...whereInputObject },
      ...pagination.constructPaginationQueryObject(),
      orderBy: { [this.getSortField(filters.sortFor)]: filters.sortType },
      include: {
        scope: true,
      },
    });
    return {
      ngos,
      pagination,
    };
  }

  async updateRefreshToken(id: number, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await argon2.hash(refreshToken)
      : null;
    await this.prismaService.nGO.update({
      where: {
        id,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async createNgo(ngo: CreateNgoDto): Promise<NGO> {
    const salt = randomBytes(16).toString('hex');
    const ngoWithHash = {
      ...ngo,
      password: await argon2.hash(ngo.password + salt),
    };

    const defaultRoles = [NGOScopeEnum.NOT_IMPLEMENTED];

    const newNgo = await this.prismaService.nGO.create({
      data: {
        ...ngoWithHash,
        salt,
        scope: {
          connectOrCreate: defaultRoles.map((scope) => ({
            where: { name: scope },
            create: { name: scope },
          })),
        },
      },
    });
    return newNgo;
  }

  private getSortField(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'name':
        return 'name';
      default:
        return 'id';
    }
  }
}
