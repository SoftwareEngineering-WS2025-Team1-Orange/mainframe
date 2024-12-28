import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param, ParseBoolPipe,
  ParseIntPipe,
  Post, Query,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import {ReturnPaginatedDonationsDto} from "@/api-donator/dto";
import {PaginationQueryArguments} from "@/utils/pagination.service";
import {getSortType, parseEnumCategory, SortType} from "@/utils/sort_filter.service";
import {DonationFilter} from "@/shared/filter-query-dto/donation.filter.interface";
import {DonationService} from "@/shared/services/donation.service";
import {ReturnPaginatedNgosDto} from "@/api-donator/dto/ngo.dto";
import {NgoService} from "@/shared/services/ngo.service";
import {RegisterDonationBoxDto, DonationBoxDto} from "@/api-donator/dto/donationbox.dto";
import {CreateDonatorDto, ReturnDonatorDto} from "@/api-donator/dto/donator.dto";
import {DonatorService} from "@/shared/services/donator.service";
import {ReturnPaginatedProjectsDto} from "@/api-donator/dto/project.dto";
import {ProjectService} from "@/shared/services/project.service";

@Controller('donator')
export class ApiDonatorController {
  constructor(private donationService: DonationService,
              private ngoService: NgoService,
              private donatorService: DonatorService,
              private projectService: ProjectService) {
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({type: ReturnPaginatedDonationsDto})
  @Get('/')
  testDonatorApi() {
    return 'Donator API is working';
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({type: ReturnDonatorDto})
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
  @SerializeOptions({type: ReturnPaginatedDonationsDto})
  @Get('/:donator_id/donation')
  getDonatorsDonations(
    @Query('donator_id', new ParseIntPipe({optional: true}))
    donatorId: number,
    @Query('filter_id', new ParseIntPipe({optional: true})) filterId?: number,
    @Query('filter_ngo_id', new ParseIntPipe({optional: true}))
    filterNgoId?: number,
    @Query('filter_ngo_name') filterNgoName?: string,
    @Query('filter_project_id', new ParseIntPipe({optional: true}))
    filterProjectId?: number,
    @Query('filter_project_name') filterProjectName?: string,
    @Query('filter_created_from') filterCreatedFrom?: Date,
    @Query('filter_created_to') filterCreatedTo?: Date,
    @Query('filter_amount_from', new ParseIntPipe({optional: true}))
    filterAmountFrom?: number,
    @Query('filter_amount_to', new ParseIntPipe({optional: true}))
    filterAmountTo?: number,
    @Query('sort_for') sortFor?: string,
    @Query('sort_type') sortType?: string,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({optional: true}))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({optional: true}),
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
    return this.donationService.findFilteredDonations(filters);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({type: ReturnPaginatedNgosDto})
  @Get('/:donator_id/ngo')
  getFilteredNgos(
    //@Param('donator_id', ParseIntPipe) donatorId: number,
    @Query('filter_ngo_id', new ParseIntPipe({optional: true}))
    filterId?: number,
    // @Query('filter_is_favorite', new ParseBoolPipe({ optional: true }))
    // filterIsFavorite: boolean = false,
    @Query('filter_name_contains') filterName?: string,
    @Query('filter_mail_contains') filterMail?: string,
    // @Query('filter_donated_to', new ParseBoolPipe({ optional: true }))
    // filterDonatedTo: boolean = false,
    @Query(PaginationQueryArguments.page, new ParseIntPipe({optional: true}))
    paginationPage?: number,
    @Query(
      PaginationQueryArguments.pageSize,
      new ParseIntPipe({optional: true}),
    )
    paginationPageSize?: number,
    @Query('sort_type') sortType?: string,
    @Query('sort_for') sortFor?: string,
  ) {
    return this.ngoService.findFilteredNgos(
      filterId,
      // filterIsFavorite,
      filterName,
      filterMail,
      // filterDonatedTo,
      paginationPage,
      paginationPageSize,
      getSortType(sortType),
      sortFor,
    );
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnPaginatedProjectsDto })
  @Get('/:donator_id/project')
  getFilteredProjects(
    //@Param('donator_id', ParseIntPipe) donatorId: number,
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
}
