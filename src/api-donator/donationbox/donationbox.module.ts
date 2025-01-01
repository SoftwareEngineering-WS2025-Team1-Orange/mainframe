import { Module } from '@nestjs/common';
import { DonationboxController } from './donationbox.controller';
import { DonationboxService } from '@/shared/services/donationbox.service';

@Module({
  controllers: [DonationboxController],
  providers: [DonationboxService],
})
export class DonationboxModule {}
