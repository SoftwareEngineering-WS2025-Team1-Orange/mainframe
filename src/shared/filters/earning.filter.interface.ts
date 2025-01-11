import { BaseFilter } from '@/shared/filters/base.filter.interface';

export interface EarningFilter extends BaseFilter {
  filterId?: number;
  filterDonatorId?: number;
  filterDonationboxId?: number;
  filterCreatedFrom?: Date;
  filterCreatedTo?: Date;
  filterAmountFrom?: number;
  filterAmountTo?: number;
}

export interface EarningIncludePartialRelations {
  payout?: boolean;
  donationBox?: boolean;
}
