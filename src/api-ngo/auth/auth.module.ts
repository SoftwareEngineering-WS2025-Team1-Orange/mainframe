import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from '@/shared/auth/strategy/accessToken.strategy';
import { RefreshTokenStrategy } from '@/shared/auth/strategy/refreshToken.strategy';
import { AuthController } from '@/api-ngo/auth/auth.controller';
import { AuthService } from '@/api-ngo/auth/auth.service';
import { NgoService } from '@/shared/services/ngo.service';
import { SharedServicesModule } from '@/shared/services/shared-services.module';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule,
    PassportModule,
    SharedServicesModule,
  ],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
    NgoService,
  ],
})
export class AuthModule {}
