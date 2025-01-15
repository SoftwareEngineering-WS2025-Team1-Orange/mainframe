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
import { DonatorScopeEnum } from '@prisma/client';
import { NgoService } from '@/shared/services/ngo.service';
import {
  ReturnNgoDto,
  ReturnPaginatedNgosDto,
} from '@/api-donator/ngo/dto/ngo.dto';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { prefix } from '@/api-donator/prefix';
import { NgoFilter } from '@/shared/filters/ngo.filter.interface';
import { DonatorAccessTokenGuard } from '../auth/accessToken.guard';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';

@Controller(`${prefix}/ngo`)
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Version('1')
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.READ_NGO)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedNgosDto })
  @Get('donator/:donator_id')
  getFilteredNgos(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Req() req: Request,
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
    rejectOnNotOwnedResource(donatorId, req);
    const filters: NgoFilter = {
      filterId,
      filterFavorizedByDonatorId: filterIsFavorite ? donatorId : null,
      filterNotFavorizedByDonatorId:
        filterIsFavorite === false ? donatorId : null,
      filterName,
      filterMail,
      filterIncludeDeleted: false,
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
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.WRITE_DONATOR)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Put(':ngo_id/donator/:donator_id/favorite')
  async favoriteNgo(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Body('favorite', ParseBoolPipe) favorite: boolean,
    @Req() req: Request,
  ) {
    rejectOnNotOwnedResource(donatorId, req);
    return this.ngoService.favoriteNgo(donatorId, ngoId, favorite);
  }
}
