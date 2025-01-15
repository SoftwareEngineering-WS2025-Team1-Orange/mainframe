import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
  @SerializeOptions({ type: ReturnDonatorWithBalanceDto })
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
  getDonatorByToken(
    @Req() req: Request,
    @Query('force_earnings_update', new DefaultValuePipe(false), ParseBoolPipe)
    forceEarningsUpdate?: boolean,
  ) {
    const donator = req.user as { sub: number };
    return this.donatorService.findDonatorByIdWithBalance(
      donator.sub,
      forceEarningsUpdate,
    );
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonatorWithBalanceDto })
  @Get('/:donator_id')
  getDonatorById(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Query('force_earnings_update', new DefaultValuePipe(false), ParseBoolPipe)
    forceEarningsUpdate?: boolean,
  ) {
    return this.donatorService.findDonatorByIdWithBalance(
      donatorId,
      forceEarningsUpdate,
    );
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
