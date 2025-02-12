import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { Client } from 'minio';
import { InjectMinio } from 'nestjs-minio';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import {
  ProjectFilter,
  ProjectIncludePartialRelations,
} from '@/shared/filters/project.filter.interface';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ReturnProjectWithoutFavDto,
} from '@/api-ngo/project/dto/project.dto';
import { ProjectWithDonations } from '@/api-ngo/project/types';
import { Rule } from '@/utils/validaton/types';
import { validateRules } from '@/utils/validaton/validation.helper';
import { BUCKET_NAME, createBannerUri } from '@/utils/minio.helper';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';
import { DonationService } from '@/shared/services/donation.service';

@Injectable()
export class ProjectService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private donationService: DonationService,
    @InjectMinio() private minioClient: Client,
  ) {}

  async calculateCurrentFundraisingTotal(projectId: number): Promise<number> {
    const donations = await this.prismaService.donation.aggregate({
      _sum: {
        amountInCent: true,
      },
      where: {
        projectId,
      },
    });
    // eslint-disable-next-line no-underscore-dangle
    return donations._sum.amountInCent || 0;
  }

  async findProjectById(
    id: number,
    filters: DonationFilter | null = null,
  ): Promise<
    (Project & { fundraising_current: number }) | ProjectWithDonations
  > {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
      },
    });

    if (!project) {
      throw new HttpException('Project not found', StatusCodes.NOT_FOUND);
    }
    if (!filters) {
      return {
        ...project,
        fundraising_current: await this.calculateCurrentFundraisingTotal(
          project.id,
        ),
      };
    }

    const paginatedDonations =
      await this.donationService.findFilteredDonations(filters);

    return {
      ...project,
      fundraising_current: await this.calculateCurrentFundraisingTotal(
        project.id,
      ),
      donations: {
        ...paginatedDonations,
      },
    };
  }

  async findFilteredProjectsWithFavourite(
    filters: ProjectFilter,
    favourizedByDonatorId?: number,
  ): Promise<{
    projects: (Project & { is_favorite: boolean })[];
    pagination: Pagination;
  }> {
    const {
      projects,
      pagination,
    }: { projects: Project[]; pagination: Pagination } =
      await this.findFilteredProjectsWithPartialRelations(filters, {
        ngo: true,
        donations: false,
        FavouritedByDonators: false,
      });

    const favorizedProjects = await this.prismaService.project.findMany({
      select: {
        id: true,
      },
      where: {
        FavouritedByDonators: favourizedByDonatorId
          ? { some: { id: favourizedByDonatorId } }
          : {},
      },
    });

    const favorizedProjectIDs: Set<number> = new Set(
      favorizedProjects.map((project) => project.id),
    );

    const projectsWithIsFavorite = projects.map(
      (project: Project & { is_favorite: boolean }) => ({
        ...project,
        is_favorite: favorizedProjectIDs.has(project.id),
      }),
    );
    return { projects: projectsWithIsFavorite, pagination };
  }

  async findFilteredProjectsWithPartialRelations(
    filters: ProjectFilter,
    includePartialRelations: ProjectIncludePartialRelations,
  ): Promise<{
    projects: (Project & { fundraising_current: number })[];
    pagination: Pagination;
  }> {
    const whereInputObject: Prisma.ProjectWhereInput = {
      AND: [
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterCategory ? { category: filters.filterCategory } : {},
        filters.filterName
          ? { name: { contains: filters.filterName, mode: 'insensitive' } }
          : {},
        !filters.filterIncludeArchived ? { archived: false } : {},
        filters.filterNgoId != null ? { ngoId: filters.filterNgoId } : {},
        filters.filterNgoName
          ? {
              ngo: {
                name: { contains: filters.filterNgoName, mode: 'insensitive' },
              },
            }
          : {},
        filters.filterFavoriteByDonatorId != null
          ? {
              FavouritedByDonators: {
                some: { id: filters.filterFavoriteByDonatorId },
              },
            }
          : {},
        filters.filterNotFavoriteByDonatorId != null
          ? {
              FavouritedByDonators: {
                none: { id: filters.filterNotFavoriteByDonatorId },
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

    const numTotalResults = await this.prismaService.project.count();
    const numFilteredResults = await this.prismaService.project.count({
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
    const projects = await this.prismaService.project.findMany({
      where: {
        ...whereInputObject,
      },
      ...pagination.constructPaginationQueryObject(),
      include: {
        ngo: includePartialRelations.ngo
          ? {
              select: {
                name: true,
                id: true,
              },
            }
          : undefined,
        donations: includePartialRelations.donations
          ? {
              select: {
                id: true,
                amountInCent: true,
                createdAt: true,
              },
            }
          : undefined,
        FavouritedByDonators: includePartialRelations.FavouritedByDonators
          ? {
              select: {
                id: true,
              },
            }
          : undefined,
      },
      orderBy: { [this.getSortField(filters.sortFor)]: filters.sortType },
    });
    const projectsWithFundraisingCurrent = projects.map(async (project) => ({
      ...project,
      fundraising_current: await this.calculateCurrentFundraisingTotal(
        project.id,
      ),
    }));
    return {
      projects: await Promise.all(projectsWithFundraisingCurrent),
      pagination,
    };
  }

  async createProject(
    ngoId: number,
    project: CreateProjectDto,
  ): Promise<ReturnProjectWithoutFavDto> {
    const dateIsNotBeforeOneWeek: Rule<undefined, CreateProjectDto> = {
      condition: (_previous: undefined, future: CreateProjectDto) =>
        new Date(future.target_date) >
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      onFailure: new BadRequestException(
        'Target date must be at least one week in the future',
      ),
    };
    await validateRules(undefined, project, [dateIsNotBeforeOneWeek]);

    const createdProject = await this.prismaService.project.create({
      data: {
        ...project,
        ngo: {
          connect: {
            id: ngoId,
          },
        },
      },
    });
    return {
      ...createdProject,
      fundraising_current: 0,
    };
  }

  async updateProject(
    id: number,
    project: UpdateProjectDto,
  ): Promise<ReturnProjectWithoutFavDto> {
    const isNotArchived: Rule<ProjectWithDonations, UpdateProjectDto> = {
      condition: (previous: ProjectWithDonations, _future: UpdateProjectDto) =>
        !previous.archived,
      onFailure: new BadRequestException('Archived projects cannot be updated'),
    };

    const hasNoDonations: Rule<ProjectWithDonations, UpdateProjectDto> = {
      condition: (previous: ProjectWithDonations, future: UpdateProjectDto) =>
        previous.donations.donations.length === 0 ||
        future.fundraising_goal === undefined,
      onFailure: new BadRequestException(
        'Only the name, description, category and progress can be updated for projects with donations',
      ),
    };

    const projectToUpdate = (await this.findProjectById(id, {
      filterProjectId: id,
    })) as ProjectWithDonations;

    await validateRules(projectToUpdate, project, [
      isNotArchived,
      hasNoDonations,
    ]);

    const updatedProject = await this.prismaService.project.update({
      where: {
        id,
      },
      data: project,
    });

    return {
      ...updatedProject,
      fundraising_current: await this.calculateCurrentFundraisingTotal(
        updatedProject.id,
      ),
    };
  }

  private async getBannerUriForDb(
    id: number,
    banner: Express.Multer.File,
  ): Promise<string | null> {
    if (!banner) {
      const project = await this.prismaService.project.findFirst({
        where: {
          id,
          archived: false,
        },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      const bannerUri = project.banner_uri.split(BUCKET_NAME)[1];
      await this.minioClient.removeObject(`${BUCKET_NAME}/`, bannerUri);
      return null;
    }
    const storagePath = `project/${id}/banner.${banner.mimetype.split('/')[1]}`;
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

  async updateProjectBanner(
    id: number,
    banner?: Express.Multer.File,
  ): Promise<ReturnProjectWithoutFavDto> {
    const bannerUriForDB = await this.getBannerUriForDb(id, banner);

    const updatedProject = await this.prismaService.project
      .update({
        where: {
          id,
          archived: false,
        },
        data: {
          banner_uri: bannerUriForDB,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException('Project not found.');
        }
        throw new InternalServerErrorException(
          'Something went wrong updating the project.',
        );
      });

    return {
      ...updatedProject,
      fundraising_current: await this.calculateCurrentFundraisingTotal(
        updatedProject.id,
      ),
    };
  }

  async deleteProject(id: number): Promise<ReturnProjectWithoutFavDto> {
    // A project can only be deleted if it has no donations or if progress is at 100
    const project = await this.prismaService.project
      .update({
        where: {
          id,
          archived: false,
          OR: [
            {
              donations: {
                none: {},
              },
            },
            {
              progress: 100,
            },
          ],
        },
        data: {
          archived: true,
        },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new NotFoundException(
            'Project could not be archived. ' +
              'Please check if the project exists and that no donation were already made ' +
              'or the progress is not by 100. Also check if the project is not archived.',
          );
        }
        throw new InternalServerErrorException(
          'Something went wrong archiving the Project.',
        );
      });

    if (!project) {
      throw new HttpException('Project not found.', StatusCodes.NOT_FOUND);
    }

    return {
      ...project,
      fundraising_current: await this.calculateCurrentFundraisingTotal(
        project.id,
      ),
    };
  }

  async findFilteredProjects(
    filters: ProjectFilter,
  ): Promise<{ projects: Project[]; pagination: Pagination }> {
    return this.findFilteredProjectsWithPartialRelations(filters, {
      ngo: false,
      donations: false,
      FavouritedByDonators: false,
    });
  }

  private getSortField(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'name':
        return 'name';
      case 'donated_recently':
      default:
        return 'id';
    }
  }

  async favoriteProject(
    donatorId: number,
    projectId: number,
    favorite: boolean,
  ): Promise<Project & { is_favorite: boolean; fundraising_current: number }> {
    try {
      const donator = await this.prismaService.donator.findFirstOrThrow({
        where: {
          id: donatorId,
        },
      });
      const project = await this.prismaService.project.update({
        where: { id: projectId },
        data: {
          FavouritedByDonators: favorite
            ? { connect: { id: donator.id } }
            : { disconnect: { id: donator.id } },
        },
        include: {
          ngo: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });
      return {
        ...project,
        fundraising_current: await this.calculateCurrentFundraisingTotal(
          project.id,
        ),
        is_favorite: favorite,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('Project or Donator not found.');
      }
      throw new InternalServerErrorException(
        'Something went wrong favoriting the project.',
      );
    }
  }
}
