import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class Phase {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  allocatedTime: number;

  @Prop({ default: '' })
  courseId?: ObjectId;

  @Prop({ default: '' })
  planId?: ObjectId;

  @Prop({ required: true })
  phaseIndex: number;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop({ default: null })
  deletedBy?: ObjectId;
}

export const PhaseSchema = SchemaFactory.createForClass(Phase);
