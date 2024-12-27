import { HttpException, Injectable } from '@nestjs/common';
import { NGO, NGOScopeEnum, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNgoDto } from '@/ngo/dto/ngo.dto';
import { Pagination } from '@/utils/pagination.service';
import { NGOWithScope } from '@/api-ngo/auth/types';

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

  async findFilteredNgos(
    filterId?: number,
    // filterIsFavorite: boolean = false,
    filterName?: string,
    filterMail?: string,
    // filterDonatedTo: boolean = false,
    paginationPage: number = 1,
    paginationResultsPerPage: number = 10,
    sortType?: string,
    sortFor?: string,
  ): Promise<{ ngos: NGOWithScope[]; pagination: Pagination }> {
    const whereInputObject: Prisma.NGOWhereInput = {
      AND: [
        filterId ? { id: filterId } : {},
        filterName
          ? { name: { contains: filterName, mode: 'insensitive' } }
          : {},
        filterMail
          ? { email: { contains: filterMail, mode: 'insensitive' } }
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
      paginationResultsPerPage,
      paginationPage,
    );
    const ngos = await this.prismaService.nGO.findMany({
      where: { ...whereInputObject },
      ...pagination.constructPaginationQueryObject(),
      orderBy: { [this.getSortField(sortFor)]: sortType },
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
