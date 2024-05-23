import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Test {
  @Prop({ required: true, unique: true })
  testName: string;

  @Prop({ required: true })
  teams: Array<string>;

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
  totalMilestones: number;

  @Prop({ required: true })
  noOfTopics: number;

  @Prop({ required: true })
  estimatedTime: number;
}

export const TestSchema = SchemaFactory.createForClass(Test);
