import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { JWTDonatorPayload } from '@/api-donator/auth/types';
import { AuthService } from '@/api-donator/auth/auth.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-donator',
) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const accessToken: string = configService.get('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessToken,
    });
  }

  validate(payload: JWTDonatorPayload) {
    return payload;
  }
}
