import {
  IsString,
  Length,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
export class ResetDto {
  @IsString() @Length(64, 64) token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[A-Za-z]/)
  @Matches(/[0-9]/)
  newPassword!: string;
}
