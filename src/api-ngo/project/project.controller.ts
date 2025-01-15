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
import { NGOScopeEnum } from '@prisma/client';
import { ParseDatePipe } from '@nestjs/common/pipes/parse-date.pipe';
import { ProjectService } from '@/shared/services/project.service';
import { parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { prefix } from '@/api-ngo/prefix';
import { NGOAccessTokenGuard } from '@/api-ngo/auth/accessToken.guard';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';
import {
  CreateProjectDto,
  ReturnProjectWithPaginatedDonations,
  UpdateProjectDto,
  ReturnProjectWithoutFavDto,
} from '@/api-ngo/project/dto/project.dto';
import { FileTypeExtendedValidator } from '@/shared/validators/file_type_magic.validator';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';

@Controller(`${prefix}/ngo/:ngo_id/project`)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Get('/')
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.READ_NGO)
  getFilteredProjects(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filter_project_id?: number,
    @Query('filter_category')
    filterCategory?: string,
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
      filterId: filter_project_id,
      filterCategory: parseEnumCategory(filterCategory),
      filterName,
      filterIncludeArchived,
      filterNgoId,
      filterNgoName,
      sortFor,
      sortType,
      paginationPage,
      paginationPageSize,
    };
    return this.projectService.findFilteredProjectsWithFavourite(filters, null);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithPaginatedDonations })
  @Get('/:project_id/')
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.READ_NGO, NGOScopeEnum.READ_PROJECT)
  getProjectWithDonations(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
    @Query('filter_donation_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_created_from', new ParseDatePipe({ optional: true }))
    filter_created_from?: Date,
    @Query('filter_created_to', new ParseDatePipe({ optional: true }))
    filter_created_to?: Date,
    @Query('filter_amount_from')
    filterAmountFrom?: string,
    @Query('filter_amount_to')
    filterAmountTo?: string,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
    @Query('sort_for')
    sortFor?: string,
    @Query('sort_type') sortType?: string,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    const filters: DonationFilter = {
      filterId,
      filterDonatorId: null,
      filterDonatorFirstName: null,
      filterDonatorLastName: null,
      filterNgoId: ngoId,
      filterNgoName: null,
      filterProjectId: projectId,
      filterProjectName: null,
      filterCreatedFrom: filter_created_from,
      filterCreatedTo: filter_created_to,
      filterAmountFrom: Number.parseFloat(filterAmountFrom),
      filterAmountTo: Number.parseFloat(filterAmountTo),
      sortFor,
      sortType,
      paginationPage,
      paginationPageSize,
    };
    return this.projectService.findProjectById(projectId, filters);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnProjectWithoutFavDto })
  @Post('/')
  @UseGuards(NGOAccessTokenGuard)
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.WRITE_PROJECT)
  createProject(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
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
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.WRITE_PROJECT)
  updateProject(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
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
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.WRITE_PROJECT)
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
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.WRITE_PROJECT)
  deleteNgo(
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
  ) {
    rejectOnNotOwnedResource(ngoId, req);
    return this.projectService.deleteProject(projectId);
  }
}
