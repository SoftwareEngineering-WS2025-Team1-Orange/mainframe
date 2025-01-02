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
import { DonationboxService } from '@/shared/services/donationbox.service';
import { DonationBoxDto, RegisterDonationBoxDto } from './dto';

import { prefix } from '@/api-donator/prefix';

@Controller(`${prefix}/donationbox`)
export class DonationboxController {
  constructor(private donationboxService: DonationboxService) {}

  @Version('1')
  @Post('/donator/:donator_id')
  postDonationBoxToDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Body() donationBox: RegisterDonationBoxDto,
  ) {
    this.donationboxService
      .registerDonationBox(donatorId, donationBox)
      .catch(() => {});
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: DonationBoxDto })
  @Get('/donator/:donator_id')
  getDonationboxesOfDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
  ) {
    return this.donationboxService.findDonationboxesByDonatorId(donatorId);
  }
}
