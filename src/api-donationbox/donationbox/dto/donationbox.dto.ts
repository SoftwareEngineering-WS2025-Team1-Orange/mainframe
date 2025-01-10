import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsString } from 'class-validator';

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

export class DonationBoxContainerStatusDto {
  @IsArray()
  @Type(() => ContainerStatusDto)
  containerStatus: ContainerStatusDto[];
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
