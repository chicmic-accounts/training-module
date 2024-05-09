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

  @Prop({ required: true })
  courseId: ObjectId;

  @Prop({ required: true })
  phaseIndex: number;
}

export const PhaseSchema = SchemaFactory.createForClass(Phase);
