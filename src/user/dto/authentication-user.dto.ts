// import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthenticationUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
