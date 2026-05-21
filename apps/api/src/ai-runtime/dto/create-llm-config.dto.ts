import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export class CreateLlmConfigDto {
  // `key` é livre. Cada projeto define suas próprias chaves
  // (ex: "extractor", "chat", "summarizer"). Restringimos ao formato
  // kebab/snake_case para evitar lixo no banco.
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{0,63}$/, {
    message: 'key deve ser kebab/snake_case (a-z, 0-9, -, _; até 64 chars)',
  })
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32_000)
  prompt!: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(2_000)
  notes?: string;
}
