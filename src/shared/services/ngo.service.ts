import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { NGO, NGOScopeEnum, Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { Client } from 'minio';
import { InjectMinio } from 'nestjs-minio';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateNgoDto, UpdateNgoDto } from '@/api-ngo/ngo/dto/ngo.dto';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { NGOWithScope } from '@/api-ngo/auth/types';
import { NgoFilter } from '@/shared/filters/ngo.filter.interface';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { ProjectService } from '@/shared/services/project.service';

@Injectable()
export class NgoService {
  constructor(
    private prismaService: PrismaService,
    private projectService: ProjectService,
    @InjectMinio() private minioClient: Client,
  ) {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const initMinio = async () => {
      const isBucketAvailable = await this.minioClient.bucketExists('public');
      if (!isBucketAvailable) {
        const settings = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: ['*'],
              },
              Action: ['s3:GetObject'],
              Resource: ['arn:aws:s3:::public/*'],
            },
          ],
        });
        // Settings for public minio bucket that is accessible from the outside
        await this.minioClient.makeBucket('public', 'us-east-1', {});
        await this.minioClient.setBucketPolicy('public', settings);
      }
    };

    initMinio().catch(() => {});
  }

  async findNgoByIdWithProjectFilter(
    id: number,
    projectFilter?: ProjectFilter,
  ): Promise<
    (NGO & { projects: { projects: Project[]; pagination: Pagination } }) | NGO
  > {
    const ngo = await this.prismaService.nGO.findFirst({
      where: {
        id,
      },
    });

    if (!ngo) {
      throw new HttpException('NGO not found', StatusCodes.NOT_FOUND);
    }

    if (projectFilter) {
      const { projects, pagination } =
        await this.projectService.findFilteredProjects({
          ...projectFilter,
          filterNgoId: id,
        });
      return {
        ...ngo,
        projects: {
          projects,
          pagination,
        },
      };
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
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterName
          ? { name: { contains: filters.filterName, mode: 'insensitive' } }
          : {},
        filters.filterMail
          ? { email: { contains: filters.filterMail, mode: 'insensitive' } }
          : {},
        filters.filterFavorizedByDonatorId != null
          ? {
              favouritedByDonators: {
                some: { id: filters.filterFavorizedByDonatorId },
              },
            }
          : {},
        filters.filterNotFavorizedByDonatorId != null
          ? {
              favouritedByDonators: {
                none: { id: filters.filterNotFavorizedByDonatorId },
              },
            }
          : {},
        filters.filterDonatedToByDonatorId != null
          ? {
              donations: {
                some: { donatorId: filters.filterDonatedToByDonatorId },
              },
            }
          : {},
        filters.filterNotDonatedToByDonatorId != null
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

  async updateNgoBanner(
    id: number,
    banner?: Express.Multer.File,
  ): Promise<NGO> {
    if (!banner) {
      const ngo = await this.prismaService.nGO.findFirst({
        where: {
          id,
        },
      });
      if (!ngo) {
        throw new NotFoundException('NGO not found');
      }
      const bannerUri = ngo.banner_uri.split('public')[1];
      await this.minioClient.removeObject('public/', bannerUri);
      return this.prismaService.nGO.update({
        where: {
          id,
        },
        data: { banner_uri: null },
      });
    }

    const uploadedObjectInfo = await this.minioClient.putObject(
      'public',
      `ngo/${id}/banner.${banner.mimetype.split('/')[1]}`,
      banner.buffer,
      banner.size,
      {
        'Content-Type': banner.mimetype,
      },
    );
    return this.prismaService.nGO.update({
      where: {
        id,
      },
      data: { banner_uri: uploadedObjectInfo.etag },
    });
  }

  async updateNgo(id: number, ngo: UpdateNgoDto): Promise<NGO> {
    return this.prismaService.nGO.update({
      where: {
        id,
      },
      data: ngo,
    });
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
