import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { BrapiProvider, FETCH_TOKEN } from './providers/brapi.provider';
import { MARKET_PROVIDER } from './providers/market-provider.interface';
import { YahooProvider } from './providers/yahoo.provider';

const marketProvider: Provider = {
  provide: MARKET_PROVIDER,
  inject: [ConfigService, FETCH_TOKEN],
  useFactory: (config: ConfigService, fetchImpl: typeof fetch) => {
    const driver = config.get<string>('MARKET_DRIVER') ?? 'yahoo';
    if (driver === 'brapi') return new BrapiProvider(config, fetchImpl);
    return new YahooProvider();
  },
};

const fetchProvider: Provider = {
  provide: FETCH_TOKEN,
  useValue: globalThis.fetch.bind(globalThis),
};

@Module({
  providers: [MarketService, marketProvider, fetchProvider],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
