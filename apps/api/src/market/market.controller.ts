import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MarketService } from './market.service';
import { SearchMarketDto } from './dto/search-market.dto';
import { OhlcQueryDto } from './dto/ohlc-query.dto';

@Controller({ path: 'market', version: '1' })
@Throttle({ market: { limit: 60, ttl: 60_000 } })
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('search')
  search(@Query() dto: SearchMarketDto) {
    return this.market.search(dto.q, dto.limit ?? 10);
  }

  @Get('quote/:ticker')
  async quote(@Param('ticker') ticker: string) {
    const q = await this.market.quote(ticker);
    return (
      q ?? {
        ticker: ticker.toUpperCase(),
        price: null,
        changePct: null,
        currency: 'BRL',
        lastUpdate: null,
        stale: true,
      }
    );
  }

  @Get('ohlc/:ticker')
  ohlc(@Param('ticker') ticker: string, @Query() dto: OhlcQueryDto) {
    return this.market.ohlc(ticker, dto.period);
  }
}
