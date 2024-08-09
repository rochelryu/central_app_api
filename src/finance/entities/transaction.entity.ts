import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import {
  ResultStateEnum,
  TypePayementMobileMoney,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';
import { FinanceAccount } from './finance.entity';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Transaction {
  _id: SchemaNatif.Types.ObjectId;

  @Prop({
    type: SchemaNatif.Types.ObjectId,
    ref: FinanceAccount.name,
  })
  financeAccountId: string;

  @Prop({ default: '' })
  numero: string;

  @Prop({ default: '' })
  reference: string;

  @Prop()
  montant_send_net: number;

  @Prop()
  montant_give_of_client: number;

  @Prop({ enum: TypePayementMobileMoney })
  service: TypePayementMobileMoney;

  @Prop({ enum: TypeTransaction })
  typeTransaction: TypeTransaction;

  @Prop({ default: ResultStateEnum.INITIALISE, enum: ResultStateEnum })
  state: ResultStateEnum;

  @Prop({ required: true })
  recovery: string;

  @Prop({ default: '' })
  ref_partner: string;

  @Prop({ default: process.env.PARTNER_MOBILE_PAIEMENT })
  partner_name: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
