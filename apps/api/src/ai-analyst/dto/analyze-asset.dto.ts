import { Transform } from 'class-transformer';
import { Equals, IsString, Matches } from 'class-validator';

export class AnalyzeAssetDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  ticker!: string;

  // v1 só aceita literal 7 — preserva campo pra v2 ampliar (30 etc.) sem mudar contrato.
  @Equals(7)
  windowDays!: 7;
}
