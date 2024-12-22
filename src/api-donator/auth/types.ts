import { DonatorPermissions, Prisma } from '@prisma/client';

export type DonatorWithPermissions = Prisma.DonatorGetPayload<{
  include: {
    permissions: true;
  };
}>;

export interface JWTDonatorPayload {
  email: string;
  permissions: DonatorPermissions[];
  sub: number;
  iat: number;
}
