import { Controller, Get } from '@nestjs/common';
import { AppService, HealthCheck } from './app.service';

@Controller()
export default class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  health(): Promise<HealthCheck> {
    return this.appService.health();
  }
}
