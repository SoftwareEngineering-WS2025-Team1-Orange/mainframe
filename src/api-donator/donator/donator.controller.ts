import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { DonatorScopeEnum } from '@prisma/client';
import { DonatorService } from '@/shared/services/donator.service';
import {
  CreateDonatorDto,
  ReturnDonatorDto,
  ReturnDonatorWithBalanceDto,
  UpdateDonatorDto,
} from './dto';
import { prefix } from '@/api-donator/prefix';
import { DonatorAccessTokenGuard } from '@/api-donator/auth/accessToken.guard';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';

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
  @SerializeOptions({ type: ReturnDonatorWithBalanceDto })
  @Get('/me')
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.READ_DONATOR)
  getDonatorByToken(@Req() req: Request) {
    const donator = req.user as { sub: number };
    return this.donatorService.findDonatorByIdWithBalance(donator.sub);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorWithBalanceDto })
  @Get('/:donator_id')
  getDonatorById(@Param('donator_id', ParseIntPipe) donatorId: number) {
    return this.donatorService.findDonatorByIdWithBalance(donatorId);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorDto })
  @Put('/:donator_id')
  updateDonator(
    @Param('donator_id', ParseIntPipe)
    donatorId: number,
    @Body() updateDonatorDto: UpdateDonatorDto,
  ) {
    return this.donatorService.updateDonator(donatorId, updateDonatorDto);
  }

  @Version('1')
  @Delete('/:donator_id')
  @HttpCode(204)
  deleteDonator(
    @Param('donator_id', ParseIntPipe)
    donatorId: number,
  ) {
    return this.donatorService.deleteDonator(donatorId);
  }
}
