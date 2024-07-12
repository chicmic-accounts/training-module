import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class Task {
  @Prop({ required: true })
  mainTask: string;

  @Prop({ required: true })
  allocatedTime: number;

  @Prop({ default: '' })
  courseId?: ObjectId;

  @Prop({ default: '' })
  testId?: ObjectId;

  @Prop({ default: '' })
  milestoneId?: ObjectId;

  @Prop({ default: '' })
  phaseId?: ObjectId;

  @Prop({ required: true })
  taskIndex: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
