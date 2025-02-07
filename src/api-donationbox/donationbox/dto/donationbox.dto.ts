import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsString } from 'class-validator';
import { PluginName } from '@prisma/client';

export class DonationBoxDtoResponse {
  @Expose()
  readonly cuid: string;
}

export class ContainerStatusDto {
  @IsString()
  containerName: string;

  @IsInt()
  statusCode: number;

  @IsString()
  statusMsg: string;
}

class ProductionDto {
  @IsInt()
  solar: number;

  @IsInt()
  add: number;

  @IsInt()
  grid: number;
}

class ConsumptionDto {
  @IsInt()
  battery: number;

  @IsInt()
  house: number;

  @IsInt()
  wallbox: number;
}

export class DonationBoxPowerSupplyStatusDto {
  @IsInt()
  sysStatus: number;

  @IsInt()
  stateOfCharge: number;

  @Type(() => ProductionDto)
  production: ProductionDto;

  @Type(() => ConsumptionDto)
  consumption: ConsumptionDto;
}

export class DeployPluginDto {
  @IsObject()
  config: object;

  @IsEnum(PluginName)
  pluginName: PluginName;

  @IsString()
  cuid: string;
}
