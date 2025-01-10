import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DonatorAccessTokenGuard extends AuthGuard('donator-jwt') {}
