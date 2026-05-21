import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const STRATEGIES = [
  'balanceada',
  'crescimento',
  'renda',
  'personalizada',
] as const;

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @IsIn([...STRATEGIES])
  strategy?: (typeof STRATEGIES)[number] | null;
}
