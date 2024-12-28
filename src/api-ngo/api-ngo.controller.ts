import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import {CreateNgoDto, ReturnNgoDto} from "@/api-ngo/dto/ngo.dto";
import {NgoService} from "@/shared/services/ngo.service";

@Controller('ngo')
export class ApiNgoController {
  constructor(private ngoService: NgoService) {
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/')
  testNgoApi() {
    return 'Ngo API is working';
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Post('/')
  postNgo(@Body() createNgoDto: CreateNgoDto) {
    return this.ngoService.createNgo(createNgoDto);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ReturnNgoDto })
  @Get('/:id')
  getNgoById(@Param('id', ParseIntPipe) id: number) {
    return this.ngoService.findNgoById(id);
  }

}
