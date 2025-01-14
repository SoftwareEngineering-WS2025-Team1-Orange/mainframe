import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from '@/shared/services/ngo.service';
import { DonationService } from '@/shared/services/donation.service';
import { DonatorService } from '@/shared/services/donator.service';
import { ProjectService } from '@/shared/services/project.service';

@Module({
  controllers: [NgoController],
  providers: [NgoService, ProjectService, DonationService, DonatorService],
})
export class NgoModule {}
