import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWTNgoPayload } from '@/api-ngo/auth/types';
import { JWTDonatorPayload } from '@/api-donator/auth/types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'ngo-jwt') {
  constructor(private configService: ConfigService) {
    const accessToken: string = configService.get('NGO_JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessToken,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JWTNgoPayload | JWTDonatorPayload) {
    return payload;
  }
}
