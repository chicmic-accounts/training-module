import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class Milestone {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  allocatedTime: number;

  @Prop({ required: true })
  testId?: ObjectId;

  @Prop({ required: true })
  milestoneIndex: number;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop({ default: null })
  deletedBy?: ObjectId;
}

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);
