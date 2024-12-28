import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import AppController from '@/app.controller';
import { AppService } from '@/app.service';
import { ApiDonatorModule } from '@/api-donator/api-donator.module';
import { ApiNgoModule } from '@/api-ngo/api-ngo.module';
import { ApiDonationboxModule } from '@/api-donationbox/api-donationbox.module';
import { PrismaModule } from '@/shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ApiDonationboxModule,
    ApiDonatorModule,
    ApiNgoModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export default class AppModule {}
