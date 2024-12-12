import { Module } from '@nestjs/common';
import { DonatorModule } from './donator/donator.module';
import { DonatorService } from './donator/donator.service';
import { DonatorController } from './donator/donator.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import AppController from '@/app.controller';
import AppService from '@/app.service';

@Module({
  imports: [DonatorModule, PrismaModule],
  controllers: [DonatorController, AppController],
  providers: [DonatorService, PrismaService, AppService],
})
export default class AppModule {}
