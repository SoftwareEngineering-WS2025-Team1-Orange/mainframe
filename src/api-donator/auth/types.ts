import { DonatorScopeEnum, Prisma } from '@prisma/client';

export type DonatorWithScope = Prisma.DonatorGetPayload<{
  include: {
    scope: true;
  };
}>;

export type DonatorClientWithScope = Prisma.DonatorClientGetPayload<{
  include: {
    allowedScopes: true;
  };
}>;

export interface JWTDonatorPayload {
  email: string;
  scope: DonatorScopeEnum[];
  sub: number;
  iat: number;
}
