import { Prisma } from '@prisma/client';

export type ProjectWithDonations = Prisma.ProjectGetPayload<{
  include: {
    donations: true;
  };
}>;
