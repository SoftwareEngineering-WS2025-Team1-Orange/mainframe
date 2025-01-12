import { Global, Module } from '@nestjs/common';
import { EarningService } from '@/shared/services/earning.service';
import { DonatorService } from './donator.service';
import { MiningPoolApiModule } from '@/clients/miningpool-api/miningpool-api.module';
import { DonationService } from './donation.service';
import { DonationboxService } from './donationbox.service';
import { NgoService } from './ngo.service';
import { ProjectService } from './project.service';

@Global()
@Module({
  providers: [
    DonationService,
    DonationboxService,
    DonatorService,
    EarningService,
    NgoService,
    ProjectService,
  ],
  imports: [MiningPoolApiModule],
  exports: [
    DonationService,
    DonationboxService,
    DonatorService,
    EarningService,
    NgoService,
    ProjectService,
  ],
})
export class SharedServicesModule {}
