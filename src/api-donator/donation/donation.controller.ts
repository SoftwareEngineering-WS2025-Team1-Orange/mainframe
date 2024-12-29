import { Controller } from '@nestjs/common';
import { DonationService } from '@/shared/services/donation.service';
import { prefix } from '@/api-donator/prefix';

@Controller(`${prefix}/:donatorid/donation`)
export class DonationController {
  constructor(private donationService: DonationService) {}
}
