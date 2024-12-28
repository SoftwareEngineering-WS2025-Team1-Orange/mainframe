import { HttpException, Injectable } from '@nestjs/common';
import { Category, Prisma, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';

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

  async findFilteredProjects(
    filterProjectId?: number,
    filterCategory?: Category,
    // filterIsFavorite: boolean = false,
    filterName?: string,
    filterIncludeArchived: boolean = false,
    // filterDonatedTo: boolean = false,
    paginationPage: number = 1,
    paginationResultsPerPage: number = 10,
    filterNgoId?: number,
    filterNgoName?: string,
    sortType?: string,
    sortFor?: string,
  ): Promise<{ projects: Project[]; pagination: Pagination }> {
    const whereInputObject: Prisma.ProjectWhereInput = {
      AND: [
        filterProjectId ? { id: filterProjectId } : {},
        filterCategory ? { category: filterCategory } : {},
        filterName
          ? { name: { contains: filterName, mode: 'insensitive' } }
          : {},
        !filterIncludeArchived ? { archived: false } : {},
        filterNgoId ? { ngoId: filterNgoId } : {},
        filterNgoName
          ? {
              ngo: { name: { contains: filterNgoName, mode: 'insensitive' } },
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
      paginationResultsPerPage,
      paginationPage,
    );
    const projects = await this.prismaService.project.findMany({
      where: {
        ...whereInputObject,
      },
      ...pagination.constructPaginationQueryObject(),
      orderBy: { [this.getSortField(sortFor)]: sortType },
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
