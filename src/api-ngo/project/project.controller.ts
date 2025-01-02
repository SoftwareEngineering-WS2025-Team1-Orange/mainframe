import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Optional,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectService } from '@/shared/services/project.service';
import {
  ReturnPaginatedProjectsDto,
  ReturnProjectWithoutFavDto,
} from '@/api-donator/project/dto/project.dto';
import { parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { prefix } from '@/api-ngo/prefix';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '@/api-ngo/project/dto/project.dto';
import { FileTypeExtendedValidator } from '@/shared/validators/file_type_magic.validator';

@Controller(`${prefix}/ngo/:ngo_id/project`)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedProjectsDto })
  @Get('/')
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
    rejectOnNotOwnedResource(ngoId, req);
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
  @Post('/')
  @UseGuards(AccessTokenGuard)
  createProject(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    return this.projectService.createProject(ngoId, createProjectDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Put('/:project_id')
  @UseGuards(AccessTokenGuard)
  updateProject(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Param(':project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    return this.projectService.updateProject(projectId, updateProjectDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(FileInterceptor('banner'))
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Patch('/:project_id/banner_uri')
  @UseGuards(AccessTokenGuard)
  patchProjectBanner(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Param('project_id', ParseIntPipe)
    projectId: number,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5_000_000 }),
          new FileTypeExtendedValidator({
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
            allowedFileExtensions: ['png', 'jpeg', 'jpg'],
            fileType: '.(png|jpeg|jpg)',
          }),
        ],
      }),
    )
    @Optional()
    banner?: Express.Multer.File,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    return this.projectService.updateProjectBanner(projectId, banner);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Delete('/:project_id')
  @UseGuards(AccessTokenGuard)
  deleteNgo(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    return this.projectService.deleteProject(projectId);
  }
}
