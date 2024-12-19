import { HttpException, Injectable } from '@nestjs/common';
import { NGO } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';

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
    // filterDonatedTo: boolean = false,
    paginationPage: number = 1,
    paginationResultsPerPage: number = 10,
    sortType?: string,
    sortFor?: string,
  ): Promise<NGO[]> {
    const ngos = await this.prismaService.nGO.findMany({
      where: {
        AND: [
          filterId ? { id: filterId } : {},
          filterName
            ? { name: { contains: filterName, mode: 'insensitive' } }
            : {},
        ],
      },
      skip: (paginationPage - 1) * paginationResultsPerPage,
      take: paginationResultsPerPage,
      orderBy: { [this.getSortField(sortFor)]: sortType },
    });
    return ngos;
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
