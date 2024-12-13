import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DonatorModule } from './donator/donator.module';
import { DonatorService } from './donator/donator.service';
import { DonatorController } from './donator/donator.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { DonationboxService } from './donationbox/donationbox.service';
import { DonationboxModule } from './donationbox/donationbox.module';
import AppController from '@/app.controller';
import AppService from '@/app.service';
import DonationboxGateway from '@/donationbox/donationbox.gateway';

@Module({
  imports: [
    DonatorModule,
    PrismaModule,
    ConfigModule.forRoot(),
    DonationboxModule,
  ],
  controllers: [DonatorController, AppController],
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
