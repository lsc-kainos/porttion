import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller('api/v1/wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.wallets.list(req.user.id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateWalletDto) {
    return this.wallets.create(req.user.id, {
      name: dto.name.trim(),
      baseCurrency: dto.baseCurrency,
      strategy: dto.strategy ?? null,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.wallets.findOwned(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.wallets.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.wallets.remove(req.user.id, id);
  }
}
