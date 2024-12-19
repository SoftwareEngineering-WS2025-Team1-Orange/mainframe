import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonationboxService } from '@/donationbox/donationbox.service';
import {
  CreateJWTDonationBoxDto,
  DonationBoxDtoResponse,
  JwtDonationBoxDtoResponse,
} from './dto';

@Controller('donationbox')
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
}
