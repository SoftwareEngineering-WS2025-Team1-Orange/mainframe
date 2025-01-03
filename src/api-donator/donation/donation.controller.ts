import { Controller } from '@nestjs/common';
import { DonationService } from '@/shared/services/donation.service';
import { prefix } from '@/api-donator/prefix';

@Controller(`${prefix}/donation`)
export class DonationController {
  constructor(private donationService: DonationService) {}

  // TODO: Return correct DTO for donation from transactions (or write a new, short one) and write two dtos for donation to ngo and project (can have superclass)
  /*
  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/ngo')
  async createDonationToNgo(@Body() createDonationDto: CreateDonationDto) {
    const {donatorId, ngoId, amount} = createDonationDto;
    return this.donationService.createDonationToNgo(donatorId, ngoId, amount);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/project')
  async createDonationToProject(@Body() createDonationDto: CreateDonationDto) {
    const {donatorId, projectId, amount} = createDonationDto;
    return this.donationService.createDonationToProject(donatorId, projectId, amount);
  } */
}
