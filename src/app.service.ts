import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

enum HealthStatus {
  OK = 'ok',
  ERROR = 'error',
}

export interface HealthCheck {
  main: string;
  db: string;
}

@Injectable()
export class AppService {
  constructor(private prismaService: PrismaService) {}

  async health(): Promise<HealthCheck> {
    try {
      await this.prismaService.$connect();
      return {
        main: 'ok',
        db: 'ok',
      };
    } catch {
      return {
        main: HealthStatus.OK,
        db: HealthStatus.ERROR,
      };
    }
  }
}
