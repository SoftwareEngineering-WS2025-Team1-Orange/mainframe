import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DonatorScopeEnum } from '@prisma/client';
import { AuthService } from '@/api-donator/auth/auth.service';
import {
  DeleteOAuth2ClientDto,
  OAuth2ClientResponseDto,
  OAuth2Dto,
  OAuth2PasswordDto,
} from '@/shared/auth/dto/auth.dto';
import { DonatorAccessTokenGuard } from '@/api-donator/auth/accessToken.guard';
import { prefix } from '@/api-donator/prefix';
import { handleOAuthFlow } from '@/utils/auth.helper';
import {
  DonatorCreateOAuth2ClientDTO,
  DonatorUpdateOAuth2ClientDTO,
} from '@/api-donator/auth/dto/auth.dto';

@Controller(`${prefix}/auth`)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Version('1')
  @Post('client')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: OAuth2ClientResponseDto })
  async register(@Body() data: DonatorCreateOAuth2ClientDTO) {
    return this.authService.registerClient(data);
  }

  @Version('1')
  @Put('client/:client_id')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: OAuth2ClientResponseDto })
  async update(
    @Param('client_id') clientId: string,
    @Body() data: DonatorUpdateOAuth2ClientDTO,
    @Query('rotate_secret', new ParseBoolPipe()) rotateSecret: boolean,
  ) {
    await this.authService.validateClient(clientId, data.client_secret);
    return this.authService.updateClient(clientId, data, rotateSecret);
  }

  @Version('1')
  @Delete('client/:client_id')
  async delete(
    @Param('client_id') clientId: string,
    @Body() data: DeleteOAuth2ClientDto,
  ) {
    await this.authService.validateClient(clientId, data.client_secret);
    return this.authService.deleteClient(clientId);
  }

  @Version('1')
  @Post('token')
  async signin(
    @Body()
    data: OAuth2Dto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = await this.authService.validateClientWithScopes(
      data.client_id,
      data.client_secret,
      data.scope,
    );
    return handleOAuthFlow(
      data,
      req,
      res,
      (loginData: OAuth2PasswordDto) =>
        this.authService.signIn(
          loginData,
          client,
          data.scope as DonatorScopeEnum[],
        ),
      (token: string) =>
        this.authService.generateTokensFromRefreshToken(token, client),
    );
  }

  @Version('1')
  @Post('logout')
  @UseGuards(DonatorAccessTokenGuard)
  logout(@Req() req: Request) {
    const donator = req.user as { sub: number };
    this.authService.logout(donator.sub).catch((error) => {
      throw error;
    });
  }
}
