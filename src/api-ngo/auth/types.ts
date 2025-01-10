import { NGOScopeEnum, Prisma } from '@prisma/client';

export type NGOWithScope = Prisma.NGOGetPayload<{
  include: {
    scope: true;
  };
}>;

export type NGOClientWithScope = Prisma.NGOClientGetPayload<{
  include: {
    allowedScopes: true;
  };
}>;

export interface JWTNgoPayload {
  email: string;
  scope: NGOScopeEnum[];
  sub: number;
  iat: number;
  exp: number;
}
