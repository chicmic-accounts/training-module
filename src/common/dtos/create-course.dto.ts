import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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
}
