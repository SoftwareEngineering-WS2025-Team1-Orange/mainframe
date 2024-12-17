import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DonationboxController } from '@/donationbox/donationbox.controller';
import { DonationboxService } from '@/donationbox/donationbox.service';

@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [DonationboxController],
  providers: [DonationboxService],
})
export class DonationboxModule {}
