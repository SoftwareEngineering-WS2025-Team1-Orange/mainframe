import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import { DonatorScopeEnum } from '@prisma/client';
import { DonationService } from '@/shared/services/donation.service';
import { prefix } from '@/api-donator/prefix';
import {
  CreateDonationDto,
  ReturnDonationDto,
} from '@/api-donator/donation/dto';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { DonatorAccessTokenGuard } from '../auth/accessToken.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';
import { rejectOnNotOwnedResource } from '@/utils/auth.helper';

@Controller(`${prefix}/donation`)
export class DonationController {
  constructor(private donationService: DonationService) {}

  @Post('donator/:donator_id/ngo/:ngo_id')
  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.WRITE_DONATION)
  @SerializeOptions({ type: ReturnDonationDto })
  async createDonationToNgo(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Req() req: Request,
    @Body() createDonationDto: CreateDonationDto,
  ) {
    rejectOnNotOwnedResource(donatorId, req);
    const { amountInCent } = createDonationDto;
    return this.donationService.createDonationToNgo(
      donatorId,
      ngoId,
      amountInCent,
    );
  }

  @Post('donator/:donator_id/project/:project_id')
  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.WRITE_DONATION)
  @SerializeOptions({ type: ReturnDonationDto })
  async createDonationToProject(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
    @Req() req: Request,
    @Body() createDonationDto: CreateDonationDto,
  ) {
    rejectOnNotOwnedResource(donatorId, req);
    const { amountInCent } = createDonationDto;
    return this.donationService.createDonationToProject(
      donatorId,
      projectId,
      amountInCent,
    );
  }
}
