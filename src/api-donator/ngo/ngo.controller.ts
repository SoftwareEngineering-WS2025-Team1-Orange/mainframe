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
import { NgoService } from '@/shared/services/ngo.service';
import {
  ReturnNgoDto,
  ReturnPaginatedNgosDto,
} from '@/api-donator/ngo/dto/ngo.dto';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { prefix } from '@/api-donator/prefix';
import { NgoFilter } from '@/shared/filters/ngo.filter.interface';

@Controller(`${prefix}/:donatorid/ngo`)
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedNgosDto })
  @Get('/')
  getFilteredNgos(
    @Param('donatorid', ParseIntPipe) donatorId: number,
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query('filter_is_favorite', new ParseBoolPipe({ optional: true }))
    filterIsFavorite?: boolean,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_mail_contains') filterMail?: string,
    @Query('filter_donated_to', new ParseBoolPipe({ optional: true }))
    filterDonatedTo?: boolean,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
    @Query('sort_type') sortType?: string,
    @Query('sort_for') sortFor?: string,
  ) {
    const filters: NgoFilter = {
      filterId,
      filterFavorizedByDonatorId: filterIsFavorite ? donatorId : null,
      filterNotFavorizedByDonatorId:
        filterIsFavorite === false ? donatorId : null,
      filterName,
      filterMail,
      filterDonatedToByDonatorId: filterDonatedTo ? donatorId : null,
      filterNotDonatedToByDonatorId:
        filterDonatedTo === false ? donatorId : null,
      paginationPageSize,
      paginationPage,
      sortFor,
      sortType,
    };
    return this.ngoService.findFilteredNgosWithFavourite(filters, donatorId);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/:id')
  getNgoById(@Param('id', ParseIntPipe) id: number) {
    return this.ngoService.findNgoByIdWithProjectFilter(id);
  }
}
