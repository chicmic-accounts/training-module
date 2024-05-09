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
}

export const CourseSchema = SchemaFactory.createForClass(Course);
