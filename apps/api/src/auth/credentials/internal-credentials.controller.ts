import { Body, Controller, Post } from '@nestjs/common';
import { CredentialsService, ValidatedUser } from './credentials.service';
import { ValidateCredentialsDto } from './dto/validate.dto';
import { InternalOnly } from '../decorators/internal-only.decorator';

@Controller('api/v1/internal/auth')
@InternalOnly()
export class InternalCredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Post('validate')
  async validate(@Body() body: ValidateCredentialsDto): Promise<ValidatedUser> {
    return this.service.validate(body);
  }
}
