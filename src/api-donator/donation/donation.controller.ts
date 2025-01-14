import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { DonationService } from '@/shared/services/donation.service';
import { prefix } from '@/api-donator/prefix';
import {
  CreateDonationDto,
  ReturnDonationDto,
} from '@/api-donator/donation/dto';

@Controller(`${prefix}/donation`)
export class DonationController {
  constructor(private donationService: DonationService) {}

  @Post('donator/:donator_id/ngo/:ngo_id')
  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnDonationDto })
  async createDonationToNgo(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Param('ngo_id', ParseIntPipe) ngoId: number,
    @Body() createDonationDto: CreateDonationDto,
  ) {
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
  @SerializeOptions({ type: ReturnDonationDto })
  async createDonationToProject(
    @Param('donator_id', ParseIntPipe) donatorId: number,
    @Param('project_id', ParseIntPipe) projectId: number,
    @Body() createDonationDto: CreateDonationDto,
  ) {
    const { amountInCent } = createDonationDto;
    return this.donationService.createDonationToProject(
      donatorId,
      projectId,
      amountInCent,
    );
  }
}
