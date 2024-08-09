// import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nom complet du gestionnaire du compte',
    type: String,
    title: 'fullName',
    default: 'Coré Irié Wilfried M.',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Numero de téléphone du gestionnaire du compte',
    type: String,
    title: 'number',
    default: '0102030405',
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({
    description: 'Indicatif de votre pays',
    type: String,
    title: 'prefix',
    default: '+225',
  })
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @ApiProperty({
    description: "Nom de l'entreprise propriétaire",
    type: String,
    title: 'compagnie',
    default: 'Shouz CI',
  })
  @IsString()
  compagnie: string;

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

  @ApiProperty({
    description: 'Icon de profil',
    type: String,
    title: 'gravatar',
    default: 'avatar_1.jpg',
    required: false,
  })
  gravatar: string;
}
