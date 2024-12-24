import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonatorService } from './donator.service';
import {
  CreateDonatorDto,
  DonationBoxDto,
  RegisterDonationBoxDto,
  ReturnDonatorDto,
} from './dto';
import { ReturnPaginatedDonationsDto } from '@/donator/dto/donation.dto';
import { PaginationQueryArguments } from '@/utils/pagination.service';
import { getSortType, SortType } from '@/utils/sort_filter.service';
import { DonationFilter } from '@/donator/donator.filter.interface';

@Controller('donator')
export class DonatorController {
  constructor(private donatorService: DonatorService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Post('/')
  postDonator(@Body() createDonatorDto: CreateDonatorDto) {
    return this.donatorService.createDonator(createDonatorDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Get('/:donator_id')
  getDonatorById(@Param('donator_id', ParseIntPipe) donatorId: number) {
    return this.donatorService.findDonatorById(donatorId);
  }

  @Version('1')
  @Post('/:donator_id/donationbox')
  postDonationBoxToDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Body() donationBox: RegisterDonationBoxDto,
  ) {
    this.donatorService
      .registerDonationBox(donatorId, donationBox)
      .catch(() => {});
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: DonationBoxDto })
  @Get('/:donator_id/donationbox')
  getDonationboxesOfDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
  ) {
    return this.donatorService.findDonatorsDonationboxes(donatorId);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedDonationsDto })
  @Get('/:donator_id/donation')
  getDonatorsDonations(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Query('filter_id', new ParseIntPipe({ optional: true })) filterId?: number,
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterNgoId?: number,
    @Query('filter_ngo_name') filterNgoName?: string,
    @Query('filter_project_id', new ParseIntPipe({ optional: true }))
    filterProjectId?: number,
    @Query('filter_project_name') filterProjectName?: string,
    @Query('filter_created_from') filterCreatedFrom?: Date,
    @Query('filter_created_to') filterCreatedTo?: Date,
    @Query('filter_amount_from', new ParseIntPipe({ optional: true }))
    filterAmountFrom?: number,
    @Query('filter_amount_to', new ParseIntPipe({ optional: true }))
    filterAmountTo?: number,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({ optional: true }),
    )
    paginationPageSize?: number,
  ) {
    const normalizedSortType = getSortType(sortType, SortType.DESC);
    const filters: DonationFilter = {
      filterId,
      filterDonatorId: donatorId,
      filterNgoId,
      filterNgoName,
      filterProjectId,
      filterProjectName,
      filterCreatedFrom,
      filterCreatedTo,
      filterAmountFrom,
      filterAmountTo,
      paginationPage,
      paginationPageSize,
      sortFor,
      sortType: normalizedSortType,
    };
    return this.donatorService.findFilteredDonations(filters);
  }
}
