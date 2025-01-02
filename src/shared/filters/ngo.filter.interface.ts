import { BaseFilter } from '@/shared/filters/base.filter.interface';

export interface NgoFilter extends BaseFilter {
  filterId?: number;
  filterName?: string;
  filterMail?: string;
  filterFavorizedByDonatorId?: number;
  filterNotFavorizedByDonatorId?: number;
  filterDonatedToByDonatorId?: number;
  filterNotDonatedToByDonatorId?: number;
}
