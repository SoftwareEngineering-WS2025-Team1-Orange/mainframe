import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '@/api-ngo/auth/auth.service';
import {
  GrantType,
  OAuth2Dto,
  OAuth2PasswordDto,
  OAuth2RefreshTokenDto,
} from '@/shared/auth/dto/auth.dto';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';

@Controller('ngo/shared')
export class AuthController {
  constructor(private authService: AuthService) {}

  private buildValidationErrorResponse(errors: ValidationError[]) {
    return {
      message: errors.flatMap((e) => Object.values(e.constraints)),
      error: 'Bad Request',
      statusCode: 400,
    };
  }

  @Version('1')
  @Post('token')
  async signin(
    @Body()
    data: OAuth2Dto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (data.grant_type === GrantType.AUTHORIZATION_CODE)
      throw new Error('Not implemented');

    if (data.grant_type === GrantType.PASSWORD) {
      const toValidate = plainToInstance(OAuth2PasswordDto, data);
      await validateOrReject(toValidate).catch((error: ValidationError[]) => {
        throw new BadRequestException(this.buildValidationErrorResponse(error));
      });

      const tokens = await this.authService.signIn(toValidate);

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: req.url,
      });

      return { access_token: tokens.accessToken };
    }

    if (data.grant_type === GrantType.CLIENT_CREDENTIALS)
      throw new Error('Not implemented');

    if (data.grant_type === GrantType.REFRESH_TOKEN) {
      const toValidate = plainToInstance(OAuth2RefreshTokenDto, data);
      await validateOrReject(toValidate).catch((error: ValidationError[]) => {
        throw new BadRequestException(this.buildValidationErrorResponse(error));
      });
      const tokens = await this.authService.generateTokensFromRefreshToken(
        req.cookies.refresh_token,
      );

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: req.url,
      });

      return { access_token: tokens.accessToken };
    }

    throw new Error('Invalid grant type');
  }

  @Version('1')
  @Post('logout')
  @UseGuards(AccessTokenGuard)
  logout(@Req() req: Request) {
    const donator = req.user as { sub: number };
    this.authService.logout(donator.sub).catch((error) => {
      throw error;
    });
  }
}
