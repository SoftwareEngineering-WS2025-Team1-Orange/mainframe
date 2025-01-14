import { ConfigService } from '@nestjs/config';

export const BUCKET_NAME = 'public';

export function createBannerUri(
  banner_address: string,
  configService: ConfigService,
) {
  const protocol = (JSON.parse(configService.get('MINIO_USE_SSL')) as boolean)
    ? 'https://'
    : 'http://';

  const address = configService.get<string>('MINIO_ENDPOINT');
  const port = configService.get<string>('MINIO_PORT');

  return `${protocol}${address}:${port}/${BUCKET_NAME}/${banner_address}`;
}
