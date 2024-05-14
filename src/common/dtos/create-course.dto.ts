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

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @IsString()
  figmaLink: string;

  @IsString()
  guidelines: string;

  @IsArray()
  @IsNotEmpty()
  approver: string[];

  @IsNotEmpty()
  phases: Array<PhaseDto>;
}

export class PhaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  tasks: Array<TaskDto>;
}

export class UpdatePhaseDto extends PhaseDto {
  @IsString()
  @IsNotEmpty()
  _id?: string;

  @IsNumber()
  @IsNotEmpty()
  allocatedTime: number;

  @IsNumber()
  @IsNotEmpty()
  phaseIndex: number;

  @IsString()
  @IsNotEmpty()
  courseId: ObjectId;
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

export class CourseDto {
  courseName: string;
  figmaLink: string;
  guidelines: string;
  approver: string[];
  createdBy: string;
  totalPhases: number;
  noOfTopics: number;
  estimatedTime: number;
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

export class UpdateCourseDto extends CreateCourseDto {
  @IsOptional()
  @IsString()
  userId: string;
}
