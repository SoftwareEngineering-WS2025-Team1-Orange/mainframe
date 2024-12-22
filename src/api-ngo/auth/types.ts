import { NGOPermissions, Prisma } from '@prisma/client';

export type NGOWithPermissions = Prisma.NGOGetPayload<{
  include: {
    permissions: true;
  };
}>;

export interface JWTNGOPayload {
  email: string;
  permissions: NGOPermissions[];
  sub: number;
  iat: number;
}
