import {BaseFilter} from "@/shared/filters/base.filter.interface";

export interface DonatorFilter extends BaseFilter {
  filterId?: number;
  filterMail?: string;
  filterFirstName?: string;
  filterLastName?: string;
}
