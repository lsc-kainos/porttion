import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [WalletsModule, MarketModule],
  providers: [PositionsService],
  controllers: [PositionsController],
})
export class PositionsModule {}
