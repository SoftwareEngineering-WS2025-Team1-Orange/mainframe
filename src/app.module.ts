import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DonatorService } from './shared/services/donator.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { DonationboxService } from './donationbox/donationbox.service';
import { DonationboxModule } from './donationbox/donationbox.module';
import AppController from '@/app.controller';
import AppService from '@/app.service';
import DonationboxGateway from '@/donationbox/donationbox.gateway';
import { DonationboxController } from '@/donationbox/donationbox.controller';
import { ApiDonatorModule } from '@/api-donator/api-donator.module';
import { ApiNgoModule } from '@/api-ngo/api-ngo.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot(),
    DonationboxModule,
    ApiDonatorModule,
    ApiNgoModule,
  ],
  controllers: [
    AppController,
    DonationboxController,
  ],
  providers: [
    DonatorService,
    PrismaService,
    AppService,
    DonationboxGateway,
    DonationboxService,
    JwtService,
  ],
})
export default class AppModule {}
