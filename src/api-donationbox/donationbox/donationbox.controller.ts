import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import {
  CreateJWTDonationBoxDto,
  DeployPluginDto,
  DonationBoxDtoResponse,
  JwtDonationBoxDtoResponse,
} from './dto';

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
  @Post('/token')
  async getJWTforDonationbox(@Body() cuid_obj: CreateJWTDonationBoxDto) {
    const token = await this.donationboxService.generateToken(cuid_obj.cuid);
    return token;
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: JwtDonationBoxDtoResponse })
  @Post('/sendConfig')
  async sendConfigForDonationBox(@Body() dpDto: DeployPluginDto) {
    const msg = await this.donationboxService.sendConfig(
      dpDto.cuid,
      dpDto.pluginName,
      dpDto.config,
    );
    return msg;
  }
}
