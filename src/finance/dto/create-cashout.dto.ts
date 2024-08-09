import { IsString, Length, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TypePayementMobileMoney } from 'src/Enum/FinanceEnum';

export class CreateCashoutDto {
  @ApiProperty({
    description: 'Numéro de téléphone du compte à débiter',
    type: String,
    title: 'numberClient',
    default: '0504030201',
  })
  @IsString()
  @Length(10, 10)
  numberClient: string;

  @ApiProperty({
    description: 'Le type de service pour effectuer le paiement',
    type: String,
    enum: TypePayementMobileMoney,
    title: 'typeService',
    default: 'mtn',
  })
  @IsString()
  @IsEnum(TypePayementMobileMoney)
  typeService: TypePayementMobileMoney;

  @ApiProperty({
    description: 'Montant à débiter du compte (Min 200 et multiple de 50)',
    type: Number,
    title: 'amount',
    default: 200,
  })
  amount: number;

  @ApiProperty({
    description: 'Code Otp si besoin est (Exemple paiement par Orange)',
    type: String,
    title: 'otp',
    required: false,
  })
  otp: string;

  @ApiProperty({
    description: 'Votre identifiant de la transaction (Ex: 0xEE2832EDRFBCC)',
    type: String,
    title: 'reference',
  })
  @IsString()
  reference: string;
}
