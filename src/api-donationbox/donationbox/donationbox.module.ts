import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DonationboxController } from '@/api-donationbox/donationbox/donationbox.controller';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import DonationboxGateway from '@/api-donationbox/donationbox/donationbox.gateway';

@Module({
  imports: [JwtModule],
  controllers: [DonationboxController],
  providers: [DonationboxService, DonationboxGateway],
})
export class DonationboxModule {}
