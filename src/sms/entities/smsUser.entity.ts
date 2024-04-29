import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import { ForfaitSmsInterface } from 'src/Interfaces/ForfaitSmsInterface';
import { User } from 'src/user/entities/user.entity';

export type SmsUserDocument = HydratedDocument<SmsUser>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SmsUser {
  _id: SchemaNatif.Types.ObjectId;

  @Prop()
  secret_client: string;

  @Prop()
  secret_token: string;

  @Prop({ type: SchemaNatif.Types.ObjectId, ref: User.name, required: true })
  user_id: SchemaNatif.Types.ObjectId;

  @Prop({ type: Number })
  sms_solde: number;

  @Prop({ type: [{ type: String }], default: [] })
  sms_sender_name: string;

  @Prop({ type: [Object], default: [] })
  forfait: ForfaitSmsInterface[];

  @Prop({ type: Boolean, default: false })
  disabled: string;
}

export const SmsUserSchema = SchemaFactory.createForClass(SmsUser);
