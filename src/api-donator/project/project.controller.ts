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
import { parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { prefix } from '@/api-donator/prefix';

@Controller(`${prefix}/:donatorid/project`)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedProjectsDto })
  @Get('/')
  getFilteredProjects(
    @Param('donatorid', ParseIntPipe) donatorId: number,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_category') filterCategory?: string,
    @Query('filter_is_favorite', new ParseBoolPipe({ optional: true }))
    filterIsFavorite?: boolean,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_include_archived', new ParseBoolPipe({ optional: true }))
    filterIncludeArchived?: boolean,
    @Query('filter_donated_to', new ParseBoolPipe({ optional: true }))
    filterDonatedTo?: boolean,
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
    const filters: ProjectFilter = {
      filterId,
      filterCategory: parseEnumCategory(filterCategory),
      filterName,
      filterIncludeArchived,
      filterNgoId,
      filterNgoName,
      filterFavoriteByDonatorId: filterIsFavorite ? donatorId : null,
      filterNotFavoriteByDonatorId:
        filterIsFavorite === false ? donatorId : null,
      filterDonatedToByDonatorId: filterDonatedTo ? donatorId : null,
      filterNotDonatedToByDonatorId:
        filterDonatedTo === false ? donatorId : null,
      sortFor,
      sortType,
      paginationPage,
      paginationPageSize,
    };
    return this.projectService.findFilteredProjectsWithFavourite(
      filters,
      donatorId,
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
