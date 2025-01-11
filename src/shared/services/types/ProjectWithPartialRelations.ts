import { Project } from '@prisma/client';

type PartialNgo = {
  id: number;
  name: string;
};

type PartialDonation = {
  id: number;
  amount: number;
  createdAt: Date;
};

type PartialDonator = {
  id: number;
};

export type ProjectWithPartialRelations = Project & {
  ngo?: PartialNgo;
  donations?: PartialDonation[];
  FavouritedByDonators?: PartialDonator[];
};
