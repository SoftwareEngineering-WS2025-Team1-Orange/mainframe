import { DonatorScope, Prisma } from '@prisma/client';

export type DonatorWithScope = Prisma.DonatorGetPayload<{
  include: {
    scope: true;
  };
}>;

export interface JWTDonatorPayload {
  email: string;
  scope: DonatorScope[];
  sub: number;
  iat: number;
}
