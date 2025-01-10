import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from '@/shared/services/donation.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  controllers: [DonationController],
  providers: [DonationService, DonatorService],
})
export class DonationModule {}
