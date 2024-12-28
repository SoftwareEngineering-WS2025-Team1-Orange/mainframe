import { Module } from '@nestjs/common';
import { DonationboxModule } from '@/api-donationbox/donationbox/donationbox.module';

@Module({
  imports: [DonationboxModule],
  controllers: [],
  providers: [],
})
export class ApiDonationboxModule {}
