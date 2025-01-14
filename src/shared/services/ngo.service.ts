import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NGO, NGOScopeEnum, Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { Client } from 'minio';
import { InjectMinio } from 'nestjs-minio';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateNgoDto, UpdateNgoDto } from '@/api-ngo/ngo/dto/ngo.dto';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { NGOWithScope } from '@/api-ngo/auth/types';
import { NgoFilter } from '@/shared/filters/ngo.filter.interface';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { ProjectService } from '@/shared/services/project.service';
import { BUCKET_NAME, createBannerUri } from '@/utils/minio.helper';

@Injectable()
export class NgoService {
  constructor(
    private prismaService: PrismaService,
    private projectService: ProjectService,
    private configService: ConfigService,
    @InjectMinio() private minioClient: Client,
  ) {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const initMinio = async () => {
      const isBucketAvailable =
        await this.minioClient.bucketExists(BUCKET_NAME);
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
        await this.minioClient.makeBucket(BUCKET_NAME, 'us-east-1', {});
        await this.minioClient.setBucketPolicy(BUCKET_NAME, settings);
      }
    };

    initMinio().catch(() => {});
  }

  async findNgoByIdWithProjectFilter(
    id: number,
    projectFilter?: ProjectFilter,
  ): Promise<
    | (NGO & {
        scope: NGOScopeEnum[];
        projects: { projects: Project[]; pagination: Pagination };
      })
    | (NGO & { scope: NGOScopeEnum[] })
  > {
    const ngo = await this.prismaService.nGO.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        scope: true,
      },
    });

    if (!ngo) {
      throw new HttpException('NGO not found', StatusCodes.NOT_FOUND);
    }

    if (!projectFilter) {
      return {
        ...ngo,
        scope: ngo.scope.map((scope) => scope.name),
      };
    }

    const paginatedProjects = await this.projectService.findFilteredProjects({
      ...projectFilter,
      filterNgoId: id,
    });
    return {
      ...ngo,
      scope: ngo.scope.map((scope) => scope.name),
      projects: {
        ...paginatedProjects,
      },
    };
  }

  async findFilteredNgosWithFavourite(
    filters: NgoFilter,
    favourizedByDonatorId: number,
  ): Promise<{
    ngos: (NGOWithScope & { is_favorite: boolean })[];
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
        deletedAt: null,
      },
    });

    const favorizedNgoIDs: Set<number> = new Set(
      favorizedNgos.map((ngo) => ngo.id),
    );

    const ngosWithIsFavorite = ngos.map((ngo) => ({
      ...ngo,
      is_favorite: favorizedNgoIDs.has(ngo.id),
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
        filters.filterIncludeDeleted ? {} : { deletedAt: null },
      ],
    };

    const numTotalResults = await this.prismaService.nGO.count();
    const numFilteredResults = await this.prismaService.nGO.count({
      where: { ...whereInputObject, deletedAt: null },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      filters.paginationPageSize,
      filters.paginationPage,
    );
    const ngos = await this.prismaService.nGO.findMany({
      where: { ...whereInputObject, deletedAt: null },
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
        deletedAt: null,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async createNgo(ngo: CreateNgoDto): Promise<NGO & { scope: NGOScopeEnum[] }> {
    const salt = this.createSalt();
    const ngoWithHash = {
      ...ngo,
      password: await argon2.hash(ngo.password + salt),
    };

    const defaultRoles = Object.values(NGOScopeEnum);

    const newNgo = await this.prismaService.nGO
      .create({
        data: {
          ...ngoWithHash,
          salt,
          scope: {
            connect: defaultRoles.map((scope) => ({ name: scope })),
          },
        },
      })
      .catch(() => {
        throw new BadRequestException('NGO could not be created');
      });

    return {
      ...newNgo,
      scope: defaultRoles,
    };
  }

  private createSalt(): string {
    return randomBytes(32).toString('hex');
  }

  private async getBannerUriForDb(
    id: number,
    banner: Express.Multer.File,
  ): Promise<string | null> {
    if (!banner) {
      const ngo = await this.prismaService.nGO.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });
      if (!ngo) {
        throw new NotFoundException('NGO not found');
      }
      const bannerUri = ngo.banner_uri.split(BUCKET_NAME)[1];
      await this.minioClient.removeObject(`${BUCKET_NAME}/`, bannerUri);
      return null;
    }
    const storagePath = `ngo/${id}/banner.${banner.mimetype.split('/')[1]}`;
    await this.minioClient.putObject(
      BUCKET_NAME,
      storagePath,
      banner.buffer,
      banner.size,
      {
        'Content-Type': banner.mimetype,
      },
    );
    return createBannerUri(storagePath, this.configService);
  }

  async updateNgoBanner(
    id: number,
    banner?: Express.Multer.File,
  ): Promise<NGO & { scope: NGOScopeEnum[] }> {
    const bannerUriForDB = await this.getBannerUriForDb(id, banner);

    const updatedNgo = await this.prismaService.nGO
      .update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          banner_uri: bannerUriForDB,
        },
        include: {
          scope: true,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException('NGO not found.');
        }
        throw new InternalServerErrorException(
          'Something went wrong updating the NGO.',
        );
      });

    return {
      ...updatedNgo,
      scope: updatedNgo.scope.map((scope) => scope.name),
    };
  }

  async updateNgo(
    id: number,
    ngo: UpdateNgoDto,
  ): Promise<NGO & { scope: NGOScopeEnum[] }> {
    const updatedNgo = await this.prismaService.nGO
      .update({
        where: {
          id,
          deletedAt: null,
        },
        data: ngo,
        include: {
          scope: true,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException('NGO not found.');
        }
        throw new InternalServerErrorException(
          'Something went wrong updating the NGO.',
        );
      });

    return {
      ...updatedNgo,
      scope: updatedNgo.scope.map((scope) => scope.name),
    };
  }

  async deleteNgo(id: number): Promise<NGO & { scope: NGOScopeEnum[] }> {
    // Allow only soft delete if all projects associated with the NGO are archived
    const ngo = await this.prismaService.nGO
      .update({
        where: {
          id,
          deletedAt: null,
          projects: {
            every: {
              archived: true,
            },
          },
        },
        data: {
          deletedAt: new Date(),
          refreshToken: null,
        },
        include: {
          scope: true,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException(
            'NGO not found or not ready for deletion. ' +
              'Please check if the NGO exists, that all open projects ' +
              'are archived and the NGO is not deleted already.',
          );
        }
        throw new InternalServerErrorException(
          'Something went wrong deleting the NGO.',
        );
      });
    if (!ngo) {
      throw new HttpException('NGO not found.', StatusCodes.NOT_FOUND);
    }

    return {
      ...ngo,
      scope: ngo.scope.map((scope) => scope.name),
    };
  }

  async favoriteNgo(
    donatorId: number,
    ngoId: number,
    favorite: boolean,
  ): Promise<NGO & { is_favorite: boolean }> {
    try {
      const donator = await this.prismaService.donator.findFirstOrThrow({
        where: {
          id: donatorId,
        },
      });
      const ngo = await this.prismaService.nGO.update({
        where: { id: ngoId, deletedAt: null },
        data: {
          favouritedByDonators: favorite
            ? { connect: { id: donator.id } }
            : { disconnect: { id: donator.id } },
        },
      });
      return { ...ngo, is_favorite: favorite };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('NGO or Donator not found.');
      }
      throw new InternalServerErrorException(
        'Something went wrong favoriting the NGO.',
      );
    }
  }

  getSortField(sortFor?: string): string {
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
