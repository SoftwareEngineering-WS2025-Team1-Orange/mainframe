import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from '@/shared/services/project.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
