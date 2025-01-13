import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-ngo/auth/auth.module';
import { NgoModule } from '@/api-ngo/ngo/ngo.module';
import { ProjectModule } from '@/api-ngo/project/project.module';
import { DonationModule } from '@/api-ngo/donation/donation.module';

@Module({
  imports: [AuthModule, NgoModule, ProjectModule, DonationModule],
  controllers: [],
  providers: [],
})
export class ApiNgoModule {}
