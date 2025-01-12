import { Category } from '@prisma/client';
import { BaseFilter } from '@/shared/filters/base.filter.interface';

export interface ProjectFilter extends BaseFilter {
  filterId?: number;
  filterCategory?: Category;
  filterName?: string;
  filterIncludeArchived?: boolean;
  filterNgoId?: number;
  filterNgoName?: string;

  filterFavoriteByDonatorId?: number;
  filterNotFavoriteByDonatorId?: number;
  filterDonatedToByDonatorId?: number;
  filterNotDonatedToByDonatorId?: number;
}

export interface ProjectIncludePartialRelations {
  ngo?: boolean;
  donations?: boolean;
  FavouritedByDonators?: boolean;
}
