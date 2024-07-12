import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class SubTask {
  @Prop({ required: true })
  subTask: string;

  @Prop({default: ''})
  link: string;

  @Prop({ default: '' })
  reference: string;

  @Prop({ required: true })
  estimatedTime: number;

  @Prop({ default: '' })
  courseId: ObjectId;

  @Prop({ default: '' })
  phaseId: ObjectId;

  @Prop({ default: '' })
  milestoneId: ObjectId;

  @Prop({ default: '' })
  testId: ObjectId;

  @Prop({ required: true })
  taskId: ObjectId;

  @Prop({ required: true })
  subTaskIndex: number;
}

export const SubTaskSchema = SchemaFactory.createForClass(SubTask);
