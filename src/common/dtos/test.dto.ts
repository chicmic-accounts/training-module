import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ObjectId } from 'mongodb';

export class CreateTestDto {
  @IsString()
  @IsNotEmpty()
  testName: string;

  @IsArray()
  @IsNotEmpty()
  teams: string[];

  @IsArray()
  @IsNotEmpty()
  approver: string[];

  @IsNotEmpty()
  milestones: Array<MilestoneDto>;
}

export class MilestoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  tasks: Array<TaskDto>;
}

export class UpdateMilestoneDto extends MilestoneDto {
  @IsString()
  @IsNotEmpty()
  _id?: string;

  @IsNumber()
  @IsNotEmpty()
  allocatedTime: number;

  @IsNumber()
  @IsNotEmpty()
  milestoneIndex: number;

  @IsString()
  @IsNotEmpty()
  testId: ObjectId;
}

export class TaskDto {
  @IsString()
  @IsNotEmpty()
  mainTask: string;

  @IsNotEmpty()
  subtasks: Array<subTaskDto>;
}

export class subTaskDto {
  @IsString()
  @IsNotEmpty()
  estimatedTime: string;

  @IsString()
  @IsNotEmpty()
  link: string;

  @IsNotEmpty()
  @IsString()
  subTask: string;
}

export class UpdateApproversQueryDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class UpdateApproversDto {
  @ValidateIf((object, value) => value === undefined)
  @IsOptional()
  @IsArray()
  approver: string[];

  @ValidateIf((object, value) => value === undefined)
  @IsOptional()
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  userId: string;
}

export class UpdateTestDto extends CreateTestDto {
  @IsOptional()
  @IsString()
  userId: string;
}

export class TestDto {
  testName: string;
  approver: string[];
  teams: string[];
  createdBy: string;
  totalMilestones: number;
  noOfTopics: number;
  estimatedTime: number;
}
