import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonatorService } from './donator.service';
import {
  CreateDonatorDto,
  ReturnDonatorDto,
  ConnectDonationBoxDto,
} from './dto';

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
  @Get('/:id')
  getDonatorById(@Param('id', ParseIntPipe) id: number) {
    return this.donatorService.findDonatorById(id);
  }

  @Version('1')
  @Post('/:id/donationbox')
  postDonationBoxToDonator(
    @Param('id', ParseIntPipe) id: number,
    @Body() donationBox: ConnectDonationBoxDto,
  ) {
    this.donatorService.connectDonationBox(id, donationBox).catch(() => {});
  }
}
