import { IsEmail, IsString } from 'class-validator';

export class ValidateCredentialsDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
