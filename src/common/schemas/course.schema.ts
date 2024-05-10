import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Course {
  @Prop({ required: true, unique: true })
  courseName: string;

  @Prop({ default: '' })
  figmaLink: string;

  @Prop({ default: '' })
  guidelines: string;

  @Prop({ required: true })
  approver: Array<string>;

  @Prop({ default: false })
  approved: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ default: '' })
  updatedBy: string;

  @Prop({ default: '' })
  deletedBy: string;

  @Prop({ default: [] })
  approvedBy: string[];

  @Prop({ required: true })
  totalPhases: number;

  @Prop({ required: true })
  noOfTopics: number;

  @Prop({ required: true })
  estimatedTime: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
