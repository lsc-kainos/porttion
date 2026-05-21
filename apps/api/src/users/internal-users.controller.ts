import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InternalOnly } from '../auth/decorators/internal-only.decorator';
import { UsersService } from './users.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Controller('api/v1/internal/users')
// Internal S2S endpoint chamado pelo web no jwtCallback do NextAuth. Sob carga
// concorrente (CI rodando suite de e2e) a bucket `default` estoura e o web
// passa a falhar com "User sync failed (429)". Marcamos a controller pra
// pular todas as buckets nomeadas — auth/segurança aqui vem do
// InternalServiceGuard, não do throttler.
@SkipThrottle({
  default: true,
  'auth-email': true,
  market: true,
  'ai-analyst': true,
})
export class InternalUsersController {
  constructor(private readonly users: UsersService) {}

  @InternalOnly()
  @Post('sync')
  async sync(@Body() dto: SyncUserDto) {
    const user = await this.users.upsertByEmail({
      email: dto.email,
      name: dto.name,
      avatar: dto.avatar,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    };
  }

  @InternalOnly()
  @Delete('by-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteByEmail(@Body() dto: DeleteUserDto): Promise<void> {
    await this.users.deleteByEmail(dto.email);
  }
}
