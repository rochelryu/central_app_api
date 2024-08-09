// import { Transform } from 'class-transformer';
import { IsString, IsUrl, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFinanceDto {
  @ApiProperty({
    description: "Nom de l'application qui doit avoir au moins 3 caractères",
    type: String,
    title: 'appName',
    default: 'Shouz CI',
  })
  @IsString()
  @MinLength(3, {
    message: "Nom de l'application doit avoir au moins 3 caractères",
  })
  appName: string;

  @ApiProperty({
    description: "URL de callback qui doit contenir 'http'",
    type: String,
    title: 'urlCallback',
    default: 'https://example.com/callback',
  })
  @IsUrl(
    {},
    {
      message: 'urlCallback doit être une URL valide',
    },
  )
  @Matches(/^https?:\/\//, {
    message: "urlCallback doit commencer par 'http' ou 'https'",
  })
  urlCallback: string;
}
