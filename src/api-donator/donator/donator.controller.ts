import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonatorService } from '@/shared/services/donator.service';
import { CreateDonatorDto, ReturnDonatorDto } from './dto';

import { prefix } from '@/api-donator/prefix';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';
import { Request } from 'express';

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
  @Get('/me')
  @UseGuards(AccessTokenGuard)
  getDonatorByToken(@Req() req: Request) {
    const donator = req.user as { sub: number };
    return this.donatorService.findDonatorById(donator.sub);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Get('/:donator_id')
  getDonatorById(@Param('donator_id', ParseIntPipe) donatorId: number) {
    return this.donatorService.findDonatorById(donatorId);
  }
}
