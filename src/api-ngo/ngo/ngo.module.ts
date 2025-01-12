import { Module } from '@nestjs/common';
import { NgoController } from '@/api-ngo/ngo/ngo.controller';
import { NgoService } from '@/shared/services/ngo.service';
import { ProjectService } from '@/shared/services/project.service';
import { DonationService } from '@/shared/services/donation.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  controllers: [NgoController],
  providers: [NgoService, ProjectService, DonationService, DonatorService],
})
export class NgoModule {}
