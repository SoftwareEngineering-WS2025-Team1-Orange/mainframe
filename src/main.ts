import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const config = new DocumentBuilder()
    .setTitle('Bright Impact Mainframe API')
    .setDescription('The mainframe API description')
    .setVersion('1.0')
    .addTag('Bright Impact Mainframe API')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    customCss: '.swagger-ui .topbar { display: none }',
  });

  app.enableCors();
  app.useWebSocketAdapter(new WsAdapter(app));
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(() => {});
