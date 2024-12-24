import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DonatorModule } from './donator/donator.module';
import { DonatorService } from './donator/donator.service';
import { DonatorController } from './donator/donator.controller';
import { NgoModule } from './ngo/ngo.module';
import { NgoController } from './ngo/ngo.controller';
import { NgoService } from './ngo/ngo.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { DonationboxService } from './donationbox/donationbox.service';
import { DonationboxModule } from './donationbox/donationbox.module';
import AppController from '@/app.controller';
import AppService from '@/app.service';
import DonationboxGateway from '@/donationbox/donationbox.gateway';
import { DonationboxController } from '@/donationbox/donationbox.controller';
import { ProjectController } from '@/project/project.controller';
import { ProjectService } from '@/project/project.service';
import { ProjectModule } from '@/project/project.module';
import {DonationModule} from "@/donation/donation.module";

@Module({
  imports: [
    DonatorModule,
    NgoModule,
    DonationModule,
    PrismaModule,
    ConfigModule.forRoot(),
    DonationboxModule,
    ProjectModule,
  ],
  controllers: [
    DonatorController,
    AppController,
    DonationboxController,
    NgoController,
    ProjectController,
  ],
  providers: [
    DonatorService,
    PrismaService,
    AppService,
    NgoService,
    DonationboxGateway,
    DonationboxService,
    ProjectService,
    JwtService,
  ],
})
export default class AppModule {}
