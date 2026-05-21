import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.0000001)
  qty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.01)
  avgPrice?: number;
}
