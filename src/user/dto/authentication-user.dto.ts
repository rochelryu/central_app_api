// import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class AuthenticationUserDto {
  @ApiProperty({
    description:
      'Email professionnel ou personnel pour la connexion et accusé de reception',
    type: String,
    title: 'email',
    default: 'contact@shouz.network',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Mot de passe d'au mmoins 6 characters",
    type: String,
    title: 'password',
    default: 'qazwsxedc225R#',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]+$/,
    {
      message: 'Password must contain letters, numbers, and special characters',
    },
  )
  password: string;
}
