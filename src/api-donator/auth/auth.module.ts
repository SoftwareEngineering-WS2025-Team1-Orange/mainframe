import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from '@/api-donator/auth/strategy/accessToken.strategy';
import { AuthController } from '@/api-donator/auth/auth.controller';
import { AuthService } from '@/api-donator/auth/auth.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [AccessTokenStrategy, AuthService, DonatorService],
})
export class AuthModule {}
