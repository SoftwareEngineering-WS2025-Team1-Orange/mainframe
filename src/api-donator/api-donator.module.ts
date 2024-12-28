import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-donator/auth/auth.module';
import { DonatorModule } from '@/api-donator/donator/donator.module';
import { DonationModule } from '@/api-donator/donation/donation.module';
import { NgoModule } from '@/api-donator/ngo/ngo.module';
import { ProjectModule } from '@/api-donator/project/project.module';

@Module({
  imports: [
    AuthModule,
    DonatorModule,
    DonationModule,
    NgoModule,
    ProjectModule,
  ],
  controllers: [],
  providers: [],
})
export class ApiDonatorModule {}
