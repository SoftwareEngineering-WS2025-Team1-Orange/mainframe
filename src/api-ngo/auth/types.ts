import { Prisma } from '@prisma/client';

export type NGOWithScope = Prisma.NGOGetPayload<{
  include: {
    scope: true;
  };
}>;

export interface JWTNgoPayload {
  email: string;
  scope: NGOWithScope[];
  sub: number;
  iat: number;
}
