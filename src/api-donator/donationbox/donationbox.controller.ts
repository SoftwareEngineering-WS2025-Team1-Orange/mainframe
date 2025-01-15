import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import { DonatorScopeEnum } from '@prisma/client';
import { DonationboxService } from '@/shared/services/donationbox.service';
import { DonationBoxDto, RegisterDonationBoxDto } from './dto';
import { prefix } from '@/api-donator/prefix';
import { DonatorAccessTokenGuard } from '../auth/accessToken.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';

@Controller(`${prefix}/donationbox`)
export class DonationboxController {
  constructor(private donationboxService: DonationboxService) {}

  @Version('1')
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.WRITE_DONATIONBOX)
  @Put('/donator/:donator_id')
  connectDonationBoxToDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Req() req: Request,
    @Body() donationBox: RegisterDonationBoxDto,
  ) {
    rejectOnNotOwnedResource(donatorId, req);
    return this.donationboxService.registerDonationBox(donatorId, donationBox);
  }

  @Version('1')
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.READ_DONATIONBOX)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: DonationBoxDto })
  @Get('/donator/:donator_id')
  getDonationboxesOfDonator(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Req() req: Request,
  ) {
    rejectOnNotOwnedResource(donatorId, req);
    return this.donationboxService.findDonationboxesWithStatusesByDonatorId(
      donatorId,
    );
  }
}
