import { Donation, Donator, NGO, Project } from '@prisma/client';

export type DonationWithPartialRelations = Donation & {
  donator?: Pick<Donator, 'id' | 'firstName' | 'lastName'>;
  ngo?: Pick<NGO, 'id' | 'name'>;
  project?: Pick<Project, 'id' | 'name'>;
};
