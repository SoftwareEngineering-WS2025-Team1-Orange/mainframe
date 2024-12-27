import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import AppModule from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(() => {});
