import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class NGOAccessTokenGuard extends AuthGuard('ngo-jwt') {}
