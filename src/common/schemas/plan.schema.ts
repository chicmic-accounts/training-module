import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class Plan {
  @Prop({ required: true })
  planName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  approver: Array<string>;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop({ default: null })
  deletedBy?: ObjectId;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
