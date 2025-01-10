import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DonatorScopeEnum, NGOScopeEnum } from '@prisma/client';
import { JWTDonatorPayload } from '@/api-donator/auth/types';
import { JWTNgoPayload } from '@/api-ngo/auth/types';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.get<
      DonatorScopeEnum[] | NGOScopeEnum[]
    >('scopes', context.getHandler());
    if (!requiredScopes) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as JWTDonatorPayload | JWTNgoPayload;

    if (!user || !user.scope) {
      throw new ForbiddenException('Access denied: No scopes available');
    }

    // Cast requiredScopes to string[] to avoid type errors
    const hasScope = requiredScopes.every((scope: string) => {
      const scopes = user.scope as string[];
      return scopes.includes(scope);
    });

    if (!hasScope) {
      throw new ForbiddenException('Access denied: Insufficient scopes');
    }

    return true;
  }
}
