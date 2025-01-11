import { NGO, Project, Donation, Donator } from '@prisma/client';

type PartialNgo = Pick<NGO, 'id' | 'name'>;
type PartialDonation = Pick<Donation, 'id' | 'amount' | 'createdAt'>;
type PartialDonator = Pick<Donator, 'id'>;

export type ProjectWithPartialRelations = Project & {
  ngo?: PartialNgo;
  donations?: PartialDonation[];
  FavouritedByDonators?: PartialDonator[];
};
