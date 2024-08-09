import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import { RoleEnum } from 'src/Enum/RoleEnum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  _id: SchemaNatif.Types.ObjectId;

  @Prop()
  fullName: string;

  @Prop({ default: '' })
  compagnie: string;

  @Prop({ default: '' })
  number: string;

  @Prop({ default: '' })
  prefix: string;

  @Prop({ default: '' })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: '' })
  recovery: string;

  @Prop({ default: RoleEnum.GESTION_ADMIN, enum: RoleEnum })
  role: RoleEnum;

  @Prop({ default: 'avatar_1.jpg' })
  gravatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
