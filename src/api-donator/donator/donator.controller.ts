import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import { DonatorService } from '@/shared/services/donator.service';
import { CreateDonatorDto, ReturnDonatorDto, UpdateDonatorDto } from './dto';
import { prefix } from '@/api-donator/prefix';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';

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

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Put('/:donator_id')
  putDonator(
    @Param('donator_id', ParseIntPipe)
    donatorId: number,
    @Body() updateDonatorDto: UpdateDonatorDto,
  ) {
    return this.donatorService.updateDonator(donatorId, updateDonatorDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Delete('/:donator_id')
  deleteDonator(
    @Param('donator_id', ParseIntPipe)
    donatorId: number,
  ) {
    return this.donatorService.deleteDonator(donatorId);
  }
}
