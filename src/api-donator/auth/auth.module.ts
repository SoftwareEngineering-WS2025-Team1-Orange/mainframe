import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from '@/shared/auth/strategy/accessToken.strategy';
import { RefreshTokenStrategy } from '@/shared/auth/strategy/refreshToken.strategy';
import { AuthController } from '@/api-donator/auth/auth.controller';
import { AuthService } from '@/api-donator/auth/auth.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule, PassportModule],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
    DonatorService,
  ],
})
export class AuthModule {}
