import { Module } from '@nestjs/common';
import { NgoController } from '@/api-ngo/ngo/ngo.controller';
import { NgoService } from '@/shared/services/ngo.service';
import { ProjectService } from '@/shared/services/project.service';

@Module({
  controllers: [NgoController],
  providers: [NgoService, ProjectService],
})
export class NgoModule {}
