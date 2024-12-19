import { HttpException, Injectable } from '@nestjs/common';
import { Category, Project } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';

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
    filterShowArchived: boolean = false,
    // filterDonatedTo: boolean = false,
    paginationPage: number = 1,
    paginationResultsPerPage: number = 10,
    filterNgoId?: number,
    filterNgoName?: string,
    sortType?: string,
    sortFor?: string,
  ): Promise<Project[]> {
    const projects = await this.prismaService.project.findMany({
      where: {
        AND: [
          filterProjectId ? { id: filterProjectId } : {},
          filterCategory ? { category: filterCategory } : {},
          filterName
            ? { name: { contains: filterName, mode: 'insensitive' } }
            : {},
          !filterShowArchived ? { archived: false } : {},
          filterNgoId ? { ngoId: filterNgoId } : {},
          filterNgoName
            ? {
                ngo: { name: { contains: filterNgoName, mode: 'insensitive' } },
              }
            : {},
        ],
      },
      skip: (paginationPage - 1) * paginationResultsPerPage,
      take: paginationResultsPerPage,
      orderBy: { [this.getSortField(sortFor)]: sortType },
    });

    return projects;
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
