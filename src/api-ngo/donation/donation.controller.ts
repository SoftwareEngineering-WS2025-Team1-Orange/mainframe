import {
  ClassSerializerInterceptor,
  Controller,
  Param,
  ParseIntPipe,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { NGOScopeEnum } from '@prisma/client';
import { Request } from 'express';
import { ParseDatePipe } from '@nestjs/common/pipes/parse-date.pipe';
import { DonationService } from '@/shared/services/donation.service';
import { prefix } from '@/api-ngo/prefix';
import { NGOAccessTokenGuard } from '@/api-ngo/auth/accessToken.guard';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';
import { PaginationQueryArguments } from '@/utils/pagination/pagination.helper';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';
import { DonationFilter } from '@/shared/filters/donation.filter.interface';
import { ReturnPaginatedDonationsDto } from '@/api-ngo/donation/dto';

@Controller(`${prefix}/ngo/:ngo_id/donation`)
export class DonationController {
  constructor(private donationService: DonationService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedDonationsDto })
  @UseGuards(NGOAccessTokenGuard, ScopesGuard)
  @Scopes(NGOScopeEnum.READ_DONATION)
  getDonations(
    @Param(':ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Query('filter_donation_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    @Query(':project_id', new ParseIntPipe({ optional: true }))
    projectId?: number,
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
      filterNgoId: ngoId,
      filterProjectId: projectId,
      filterCreatedFrom: filter_created_from,
      filterCreatedTo: filter_created_to,
      filterAmountFrom: Number.parseFloat(filterAmountFrom),
      filterAmountTo: Number.parseFloat(filterAmountTo),
      sortFor,
      sortType,
      paginationPage,
      paginationPageSize,
    };
    return this.donationService.findFilteredDonations(filters, true);
  }
}
