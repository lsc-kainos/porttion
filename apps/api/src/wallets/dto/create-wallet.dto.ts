import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const STRATEGIES = [
  'balanceada',
  'crescimento',
  'renda',
  'personalizada',
] as const;
const CURRENCIES = ['BRL', 'USD', 'EUR'] as const;

export class CreateWalletDto {
  @IsString()
  @Length(2, 60)
  name!: string;

  @IsIn([...CURRENCIES])
  baseCurrency: (typeof CURRENCIES)[number] = 'BRL';

  @IsOptional()
  @IsIn([...STRATEGIES])
  strategy?: (typeof STRATEGIES)[number] | null = null;
}
