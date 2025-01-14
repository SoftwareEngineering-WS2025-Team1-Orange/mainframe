import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DonationboxController } from '@/api-donationbox/donationbox/donationbox.controller';
import { DonationboxService } from '@/api-donationbox/donationbox/donationbox.service';
import DonationboxGateway from '@/api-donationbox/donationbox/donationbox.gateway';
import { IntegratedKeyModule } from '@/utils/integrated_address_generator/monero_integrated_key.module';

@Module({
  imports: [JwtModule, IntegratedKeyModule],
  controllers: [DonationboxController],
  providers: [DonationboxService, DonationboxGateway],
})
export class DonationboxModule {}
