import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LlmConfig, Prisma } from '@prisma/client';
import { LlmConfigService } from './llm-config.service';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { availableModels } from './providers/available-models';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string };
}

type LlmConfigWithCreator = LlmConfig & { creator?: { email: string } | null };

@Controller('api/v1/admin/llm-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class LlmConfigController {
  constructor(private readonly service: LlmConfigService) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async list() {
    const all = await this.service.listAll();
    return all.map((c) => this.toDto(c));
  }

  @Get('available-models')
  getAvailableModels() {
    return availableModels(process.env);
  }

  @Get('active/:key')
  async findActive(@Param('key') key: string) {
    const cfg = await this.service.findActive(key);
    if (!cfg) throw new NotFoundException();
    return this.toDto(cfg);
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async create(@Body() dto: CreateLlmConfigDto, @Req() req: AuthRequest) {
    const allowed = availableModels(process.env);
    if (!allowed.some((m) => m.id === dto.model)) {
      throw new BadRequestException(
        `Model '${dto.model}' is not available. Available: ${allowed.map((m) => m.id).join(', ')}`,
      );
    }
    const created = await this.service.createVersion(req.user.id, {
      key: dto.key,
      model: dto.model,
      prompt: dto.prompt,
      params: (dto.params ?? {}) as Prisma.JsonObject,
      notes: dto.notes,
    });
    return this.toDto(created);
  }

  @Post(':id/activate')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async activate(@Param('id') id: string) {
    const result = await this.service.activate(id);
    return this.toDto(result);
  }

  @Post('reload-cache')
  reload() {
    return { invalidated: this.service.reloadCache() };
  }

  private toDto(c: LlmConfigWithCreator) {
    return {
      id: c.id,
      key: c.key,
      version: c.version,
      model: c.model,
      prompt: c.prompt,
      params: c.params,
      active: c.active,
      notes: c.notes,
      createdAt:
        c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      createdBy: c.createdBy,
      createdByEmail: c.creator?.email ?? null,
    };
  }
}
