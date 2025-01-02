import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Put,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from '@/shared/services/project.service';
import {
  ReturnPaginatedProjectsDto,
  ReturnProjectWithoutFavDto,
} from '@/api-donator/project/dto/project.dto';
import { parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { prefix } from '@/api-donator/prefix';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '@/api-ngo/project/dto/project.dto';

@Controller(`${prefix}`)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedProjectsDto })
  @Get('ngo/:ngo_id/project')
  @UseGuards(AccessTokenGuard)
  getFilteredProjects(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_category') filterCategory?: string,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_include_archived', new ParseBoolPipe({ optional: true }))
    filterIncludeArchived?: boolean,
    paginationPageSize?: number,
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterNgoId?: number,
    @Query('filter_ngo_name_contains')
    filterNgoName?: string,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    @Query('sort_for')
    sortFor?: string,
    @Query('sort_type') sortType?: string,
  ) {
    rejectOnNotOwnedResource(req, ngoId);
    const filters: ProjectFilter = {
      filterId,
      filterCategory: parseEnumCategory(filterCategory),
      filterName,
      filterIncludeArchived,
      filterNgoId,
      filterNgoName,
      filterFavoriteByDonatorId: null,
      filterNotFavoriteByDonatorId: null,
      filterDonatedToByDonatorId: null,
      filterNotDonatedToByDonatorId: null,
      sortFor,
      sortType,
      paginationPage,
      paginationPageSize,
    };
    return this.projectService.findFilteredProjectsWithFavourite(filters, null);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Get('ngo/:ngo_id/project')
  @UseGuards(AccessTokenGuard)
  createProject(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    rejectOnNotOwnedResource(req, ngoId);
    return this.projectService.createProject(ngoId, createProjectDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Put('ngo/:ngo_id/project/:project_id')
  @UseGuards(AccessTokenGuard)
  updateProject(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Param(':project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    rejectOnNotOwnedResource(req, ngoId);
    return this.projectService.updateProject(projectId, updateProjectDto);
  }
}
