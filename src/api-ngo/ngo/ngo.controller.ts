import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { NgoService } from '@/shared/services/ngo.service';
import {
  CreateNgoDto,
  ReturnNgoDto
} from './dto/ngo.dto';
import { prefix } from '@/api-ngo/prefix';

@Controller(`${prefix}/ngo`)
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Post('/')
  postNgo(@Body() createNgoDto: CreateNgoDto) {
    return this.ngoService.createNgo(createNgoDto);
  }
}
