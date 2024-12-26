import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWTDonatorPayload } from '@/api-donator/auth/types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-donator',
) {
  constructor(private configService: ConfigService) {
    const accessToken: string = configService.get('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessToken,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JWTDonatorPayload) {
    return payload;
  }
}
