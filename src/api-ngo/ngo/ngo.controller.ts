import {
  Body,
  ClassSerializerInterceptor,
  Controller,
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
import { NgoService } from '@/shared/services/ngo.service';
import { CreateNgoDto, ReturnNgoDto, UpdateNgoDto } from './dto/ngo.dto';
import { prefix } from '@/api-ngo/prefix';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';
import { ProjectFilter } from '@/shared/filters/project.filter.interface';
import { parseEnumCategory } from '@/utils/sort_filter.helper';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { FileTypeExtendedValidator } from '@/shared/validators/file_type_magic.validator';

@Controller(`${prefix}/ngo`)
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/me')
  @UseGuards(AccessTokenGuard)
  getMe(
    @Req() req: Request,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_category') filterCategory?: string,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_include_archived', new ParseBoolPipe({ optional: true }))
    filterIncludeArchived?: boolean,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
  ) {
    const ngo = req.user as { sub: number };
    const filter: ProjectFilter = {
      filterId,
      filterCategory: parseEnumCategory(filterCategory),
      filterName,
      filterIncludeArchived,
      filterNgoId: null,
      filterNgoName: null,

      filterFavoriteByDonatorId: null,
      filterNotFavoriteByDonatorId: null,
      filterDonatedToByDonatorId: null,
      filterNotDonatedToByDonatorId: null,

      paginationPage,
      paginationPageSize,
      sortType,
      sortFor,
    };

    return this.ngoService.findNgoByIdWithProjectFilter(ngo.sub, filter);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/:ngo_id')
  @UseGuards(AccessTokenGuard)
  getNgo(
    @Param('ngo_id', ParseIntPipe)
    ngoId: number,
    @Req() req: Request,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_category') filterCategory?: string,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_include_archived', new ParseBoolPipe({ optional: true }))
    filterIncludeArchived?: boolean,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
  ) {
    rejectOnNotOwnedResource(req, ngoId);
    const ngo = req.user as { sub: number };
    const filter: ProjectFilter = {
      filterId,
      filterCategory: parseEnumCategory(filterCategory),
      filterName,
      filterIncludeArchived,
      filterNgoId: null,
      filterNgoName: null,

      filterFavoriteByDonatorId: null,
      filterNotFavoriteByDonatorId: null,
      filterDonatedToByDonatorId: null,
      filterNotDonatedToByDonatorId: null,

      paginationPage,
      paginationPageSize,
      sortType,
      sortFor,
    };

    return this.ngoService.findNgoByIdWithProjectFilter(ngo.sub, filter);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Post('/')
  postNgo(@Body() createNgoDto: CreateNgoDto) {
    return this.ngoService.createNgo(createNgoDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(FileInterceptor('banner'))
  @SerializeOptions({ type: ReturnNgoDto })
  @Patch('/:ngo_id/banner_uri')
  @UseGuards(AccessTokenGuard)
  patchNgoBanner(
    @Param('ngo_id', ParseIntPipe)
    ngoId: number,
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
    rejectOnNotOwnedResource(req, ngoId);
    return this.ngoService.updateNgoBanner(ngoId, banner);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Put('/:ngo_id')
  @UseGuards(AccessTokenGuard)
  putNgo(
    @Param('ngo_id', ParseIntPipe)
    ngoId: number,
    @Body() updateNgoDto: UpdateNgoDto,
    @Req() req: Request,
  ) {
    rejectOnNotOwnedResource(req, ngoId);
    return this.ngoService.updateNgo(ngoId, updateNgoDto);
  }
}
