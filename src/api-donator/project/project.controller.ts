import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { ProjectService } from '@/shared/services/project.service';
import {
  ReturnPaginatedProjectsDto,
  ReturnProjectDto,
} from '@/api-donator/project/dto/project.dto';
import { getSortType, parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';

@Controller('project')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedProjectsDto })
  @Get('/')
  getFilteredProjects(
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterProjectId?: number,
    @Query('filter_category') filterCategory?: string,
    // @Query('filter_is_favorite', new ParseBoolPipe({ optional: true }))
    filterIsFavorite?: boolean,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_include_archived', new ParseBoolPipe({ optional: true }))
    filterIncludeArchived?: boolean,
    // @Query('filter_donated_to', new ParseBoolPipe({ optional: true }))
    filterDonatedTo?: boolean,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterNgoId?: number,
    @Query('filter_ngo_name_contains')
    filterNgoName?: string,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
  ) {
    return this.projectService.findFilteredProjects(
      filterProjectId,
      parseEnumCategory(filterCategory),
      // filterIsFavorite,
      filterName,
      filterIncludeArchived,
      // filterDonatedTo,
      paginationPage,
      paginationPageSize,
      filterNgoId,
      filterNgoName,
      getSortType(sortType),
      sortFor,
    );
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectDto }) // Problem: Progress is interpreted as decimal/undefined
  @Get('/:id')
  getProjectById(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findProjectById(id);
  }
}
