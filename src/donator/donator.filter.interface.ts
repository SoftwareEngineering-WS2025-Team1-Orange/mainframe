export interface DonationFilter {
  // Move to shared "services" location after future project restructuring
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
  paginationPage?: number;
  paginationPageSize?: number;
  sortType?: string;
  sortFor?: string;
}
