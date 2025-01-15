import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonatorScopeEnum } from '@prisma/client';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import {
  CreateJWTDonationBoxDto,
  DeployPluginDto,
  DonationBoxDtoResponse,
  JwtDonationBoxDtoResponse,
} from './dto';
import { NGOAccessTokenGuard } from '@/api-ngo/auth/accessToken.guard';
import { ScopesGuard } from '@/shared/auth/scopes.guard';
import { DonatorAccessTokenGuard } from '@/api-donator/auth/accessToken.guard';
import { Scopes } from '@/shared/auth/scopes.decorator';

@Controller('api-donationbox')
export class DonationboxController {
  constructor(readonly donationboxService: DonationboxService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: DonationBoxDtoResponse })
  @Post('/')
  async initDonationBox() {
    const cuid = await this.donationboxService.initNewDonationBox();
    return cuid;
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: JwtDonationBoxDtoResponse })
  @UseGuards(NGOAccessTokenGuard)
  @Post('/token')
  async getJWTforDonationbox(@Body() cuid_obj: CreateJWTDonationBoxDto) {
    const token = await this.donationboxService.generateToken(cuid_obj.cuid);
    return token;
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: JwtDonationBoxDtoResponse })
  @UseGuards(DonatorAccessTokenGuard, ScopesGuard)
  @Scopes(DonatorScopeEnum.WRITE_DONATIONBOX)
  @Post('/sendConfig')
  @HttpCode(202)
  async sendConfigForDonationBox(@Body() dpDto: DeployPluginDto) {
    const msg = await this.donationboxService.sendConfig(
      dpDto.cuid,
      dpDto.pluginName,
      dpDto.config,
    );
    return msg;
  }

  @Version('1')
  @Post('/sendStatusUpdateRequest')
  @HttpCode(202)
  async sendStatusUpdateRequest(@Body('cuid') cuid: string) {
    await this.donationboxService.sendStatusUpdateRequest(cuid);
  }
}
