import { Donation, Project } from '@prisma/client';
import { Pagination } from '@/utils/pagination/pagination.helper';

export type ProjectWithDonations = Project & {
  donations: { donations: Donation[]; pagination: Pagination };
};
