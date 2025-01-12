import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from '@/shared/services/project.service';
import { DonationService } from '@/shared/services/donation.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, DonationService, DonatorService],
})
export class ProjectModule {}
