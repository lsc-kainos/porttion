import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) @MaxLength(80) name!: string;

  @IsString()
  @MinLength(10, { message: 'Senha precisa de pelo menos 10 caracteres.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'Senha precisa conter letras.' })
  @Matches(/[0-9]/, { message: 'Senha precisa conter números.' })
  password!: string;
}
