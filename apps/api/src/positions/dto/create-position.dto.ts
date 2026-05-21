import { Transform } from 'class-transformer';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/, { message: 'ticker inválido' })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  ticker!: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.0000001)
  qty!: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.01)
  avgPrice!: number;
}
