import { IsIn, IsOptional } from 'class-validator';

export const OHLC_PERIODS = ['7d', '30d', '6m', '1a', '5a'] as const;
export type OhlcPeriodLit = (typeof OHLC_PERIODS)[number];

export class OhlcQueryDto {
  @IsOptional()
  @IsIn(OHLC_PERIODS)
  period: OhlcPeriodLit = '30d';
}
