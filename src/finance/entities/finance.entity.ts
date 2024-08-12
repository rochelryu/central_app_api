import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type FinanceAccountDocument = HydratedDocument<FinanceAccount>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class FinanceAccount {
  _id: SchemaNatif.Types.ObjectId;

  @Prop({
    type: SchemaNatif.Types.ObjectId,
    ref: User.name,
  })
  idUser: User;

  @Prop({ default: 0, type: Number })
  balance: number;

  @Prop({ default: 0.03, type: Number })
  percentage: number;

  @Prop({ default: '' })
  appName: string;

  @Prop({ default: '' })
  urlCallback: string;

  @Prop({ default: '' })
  clientId: string;

  @Prop({ default: '' })
  clientSecret: string;
}

export const FinanceAccountSchema =
  SchemaFactory.createForClass(FinanceAccount);
