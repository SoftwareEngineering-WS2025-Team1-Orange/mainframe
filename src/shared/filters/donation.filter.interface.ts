import { BaseFilter } from '@/shared/filters/base.filter.interface';

export interface DonationFilter extends BaseFilter {
  filterId?: number;
  filterDonatorId?: number;
  filterDonatorFirstName?: string;
  filterDonatorLastName?: string;
  filterNgoId?: number;
  filterNgoName?: string;
  filterProjectId?: number;
  filterProjectName?: string;
  filterCreatedFrom?: Date;
  filterCreatedTo?: Date;
  filterAmountFrom?: number;
  filterAmountTo?: number;
}
