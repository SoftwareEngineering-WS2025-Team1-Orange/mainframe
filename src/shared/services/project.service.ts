import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import {
  ProjectFilter,
  ProjectIncludePartialRelations,
} from '@/shared/filters/project.filter.interface';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  async findProjectById(id: number): Promise<Project> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
      },
    });

    if (!project) {
      throw new HttpException('Project not found', StatusCodes.NOT_FOUND);
    }
    return project;
  }

  async findFilteredProjectsWithFavourite(
    filters: ProjectFilter,
    favourizedByDonatorId: number,
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
        FavouritedByDonators: { some: { id: favourizedByDonatorId } },
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
    projects: Project[];
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
                amount: true,
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
    return { projects, pagination };
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
  ): Promise<Project & { is_favorite: boolean }> {
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
      });
      return { ...project, is_favorite: favorite };
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
