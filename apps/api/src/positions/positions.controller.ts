import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller('api/v1')
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Post('wallets/:walletId/positions')
  create(
    @Req() req: AuthedRequest,
    @Param('walletId') walletId: string,
    @Body() dto: CreatePositionDto,
  ) {
    return this.positions.create(req.user.id, walletId, dto);
  }

  @Patch('positions/:id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.positions.update(req.user.id, id, dto);
  }

  @Delete('positions/:id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.positions.remove(req.user.id, id);
  }
}
