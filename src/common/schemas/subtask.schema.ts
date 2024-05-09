import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  timestamps: true,
})
export class SubTask {
  @Prop({ required: true })
  subTask: string;

  @Prop({ required: true })
  link: string;

  @Prop({ required: true })
  estimatedTime: number;

  @Prop({ required: true })
  courseId: ObjectId;

  @Prop({ required: true })
  phaseId: ObjectId;

  @Prop({ required: true })
  taskId: ObjectId;

  @Prop({ required: true })
  subTaskIndex: number;
}

export const SubTaskSchema = SchemaFactory.createForClass(SubTask);
