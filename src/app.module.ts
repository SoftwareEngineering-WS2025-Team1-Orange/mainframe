import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import AppController from '@/app.controller';
import { AppService } from '@/app.service';
import { ApiDonatorModule } from '@/api-donator/api-donator.module';
import { ApiDonationboxModule } from '@/api-donationbox/api-donationbox.module';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { ApiNgoModule } from '@/api-ngo/api-ngo.module';
import { SharedServicesModule } from './shared/services/shared.services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NestMinioModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        isGlobal: true,
        endPoint: configService.get<string>('MINIO_ENDPOINT'),
        port: Number.parseInt(configService.get<string>('MINIO_PORT'), 10),
        useSSL: JSON.parse(
          configService.get<string>('MINIO_USE_SSL').toLowerCase(),
        ) as boolean,
        accessKey: configService.get<string>('MINIO_ACCESS_KEY'),
        secretKey: configService.get<string>('MINIO_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    ApiDonationboxModule,
    ApiDonatorModule,
    ApiNgoModule,
    PrismaModule,
    SharedServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export default class AppModule {}
