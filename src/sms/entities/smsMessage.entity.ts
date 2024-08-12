import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type SmsMessageDocument = HydratedDocument<SmsMessage>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SmsMessage {
  _id: SchemaNatif.Types.ObjectId;

  @Prop({ type: SchemaNatif.Types.ObjectId, ref: User.name, required: true })
  userId: User;

  @Prop()
  content: string;

  @Prop({ type: [{ type: String }] })
  to: string[];

  @Prop()
  sender_name: string;
}

export const SmsMessageSchema = SchemaFactory.createForClass(SmsMessage);
