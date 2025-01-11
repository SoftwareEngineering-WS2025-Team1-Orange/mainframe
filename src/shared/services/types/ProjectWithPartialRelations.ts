import { NGO, Project, Donation, Donator } from '@prisma/client';

export type ProjectWithPartialRelations = Project & {
  ngo?: Pick<NGO, 'id' | 'name'>;
  donations?: Pick<Donation, 'id' | 'amount' | 'createdAt'>[];
  FavouritedByDonators?: Pick<Donator, 'id'>[];
};

