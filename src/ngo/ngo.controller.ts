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
import { NgoService } from './ngo.service';
import { CreateNgoDto, ReturnNgoDto } from '@/ngo/dto/ngo.dto';
import { getSortType } from '@/utils/sort_filter.service';

@Controller('ngo')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/')
  getFilteredNgos(
    @Query('filter_ngo_id', new ParseIntPipe({ optional: true }))
    filterId?: number,
    // @Query('filter_is_favorite', new ParseBoolPipe({ optional: true }))
    // filterIsFavorite: boolean = false,
    @Query('filter_name_contains') filterName?: string,
    // @Query('filter_donated_to', new ParseBoolPipe({ optional: true }))
    // filterDonatedTo: boolean = false,
    @Query('pagination_page', new ParseIntPipe({ optional: true }))
    paginationPage?: number,
    @Query('pagination_results_per_page', new ParseIntPipe({ optional: true }))
    paginationResultsPerPage?: number,
    @Query('sort_type') sortType?: string,
    @Query('sort_for') sortFor?: string,
  ) {
    return this.ngoService.findFilteredNgos(
      filterId,
      // filterIsFavorite,
      filterName,
      // filterDonatedTo,
      paginationPage,
      paginationResultsPerPage,
      getSortType(sortType),
      sortFor,
    );
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
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/:id')
  getNgoById(@Param('id', ParseIntPipe) id: number) {
    return this.ngoService.findNgoById(id);
  }
}
