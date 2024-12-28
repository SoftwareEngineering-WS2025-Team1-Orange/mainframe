import { Module } from '@nestjs/common';
import {DonationService} from "./donation.service";
import {NgoService} from "@/shared/services/ngo.service";
import {DonatorService} from "@/shared/services/donator.service";
import {ProjectService} from "@/shared/services/project.service";

@Module({
  controllers: [],
  providers: [DonationService, NgoService, DonatorService, ProjectService],
  exports: [DonationService, NgoService, DonatorService, ProjectService]
})
export class SharedServicesModule {}
