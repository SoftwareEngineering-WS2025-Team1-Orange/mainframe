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
import { DonatorService } from '@/shared/services/donator.service';
import {
  CreateDonatorDto,
  DonationBoxDto,
  RegisterDonationBoxDto,
  ReturnDonatorDto,
} from './dto';

import { prefix } from '@/api-donator/prefix';

@Controller(`${prefix}/donator`)
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
}
