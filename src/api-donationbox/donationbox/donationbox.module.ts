import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DonationboxController } from '@/api-donationbox/donationbox/donationbox.controller';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import DonationboxGateway from '@/api-donationbox/donationbox/donationbox.gateway';

@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [DonationboxController],
  providers: [DonationboxService, DonationboxGateway],
})
export class DonationboxModule {}
