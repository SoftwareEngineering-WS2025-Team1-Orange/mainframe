import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AccessTokenStrategy } from '@/api-donator/auth/accessToken.strategy';
import { RefreshTokenStrategy } from '@/api-donator/auth/refreshToken.strategy';
import { AuthController } from '@/api-donator/auth/auth.controller';
import { AuthService } from '@/api-donator/auth/auth.service';
import { NgoService } from '@/ngo/ngo.service';
import { DonatorService } from '@/donator/donator.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
    NgoService,
    DonatorService,
  ],
})
export class AuthModule {}
