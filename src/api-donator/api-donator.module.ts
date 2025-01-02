import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-donator/auth/auth.module';
import { DonatorModule } from '@/api-donator/donator/donator.module';
import { DonationModule } from '@/api-donator/donation/donation.module';
import { NgoModule } from '@/api-donator/ngo/ngo.module';
import { ProjectModule } from '@/api-donator/project/project.module';
import { TransactionModule } from '@/api-donator/transaction/transaction.module';
import { DonationboxModule } from '@/api-donator/donationbox/donationbox.module';

@Module({
  imports: [
    AuthModule,
    DonatorModule,
    DonationModule,
    NgoModule,
    ProjectModule,
    TransactionModule,
    DonationboxModule,
  ],
  controllers: [],
  providers: [],
})
export class ApiDonatorModule {}
