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

  @Prop({ required: true })
  approvedBy: Array<string>;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop({ default: null })
  createdBy?: string;

  @Prop({ default: null })
  estimatedTime: number;

  @Prop({ default: false })
  approved?: boolean;

  @Prop({ default: null })
  deletedBy?: ObjectId;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
