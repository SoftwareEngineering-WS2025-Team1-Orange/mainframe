import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';

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
    projects: (Project & { isFavorite: boolean })[];
    pagination: Pagination;
  }> {
    const {
      projects,
      pagination,
    }: { projects: Project[]; pagination: Pagination } =
      await this.findFilteredProjects(filters);

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

    const projectsWithIsFavorite = projects.map((project) => ({
      ...project,
      isFavorite: favorizedProjectIDs.has(project.id),
    }));
    return { projects: projectsWithIsFavorite, pagination };
  }

  async findFilteredProjects(
    filters: ProjectFilter,
  ): Promise<{ projects: Project[]; pagination: Pagination }> {
    const whereInputObject: Prisma.ProjectWhereInput = {
      AND: [
        filters.filterId ? { id: filters.filterId } : {},
        filters.filterCategory ? { category: filters.filterCategory } : {},
        filters.filterName
          ? { name: { contains: filters.filterName, mode: 'insensitive' } }
          : {},
        !filters.filterIncludeArchived ? { archived: false } : {},
        filters.filterNgoId ? { ngoId: filters.filterNgoId } : {},
        filters.filterNgoName
          ? {
              ngo: {
                name: { contains: filters.filterNgoName, mode: 'insensitive' },
              },
            }
          : {},
        filters.filterFavoriteByDonatorId
          ? {
              FavouritedByDonators: {
                some: { id: filters.filterFavoriteByDonatorId },
              },
            }
          : {},
        filters.filterNotFavoriteByDonatorId
          ? {
              FavouritedByDonators: {
                none: { id: filters.filterNotFavoriteByDonatorId },
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
      orderBy: { [this.getSortField(filters.sortFor)]: filters.sortType },
    });
    return { projects, pagination };
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
}
