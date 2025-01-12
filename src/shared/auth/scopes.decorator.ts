import { SetMetadata } from '@nestjs/common';
import { DonatorScopeEnum, NGOScopeEnum } from '@prisma/client';

export const Scopes = (...scopes: DonatorScopeEnum[] | NGOScopeEnum[]) =>
  SetMetadata('scopes', scopes);
