import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaNatif } from 'mongoose';
import { HistoricalInterface } from 'src/Interfaces/ReserveInterface';

export type ReserveDocument = HydratedDocument<Reserve>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Reserve {
  _id: SchemaNatif.Types.ObjectId;

  @Prop({ default: 0, type: Number })
  balance: number;

  @Prop({ type: [Object], default: [] })
  historical: HistoricalInterface[];
}

export const ReserveSchema = SchemaFactory.createForClass(Reserve);
