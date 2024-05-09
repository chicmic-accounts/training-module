import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseDto } from 'src/common/dtos/create-course.dto';
import { Course } from 'src/common/schemas/course.schema';

@Injectable()
export class CourseService {
  constructor(
    // Inject the CourseModel token
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
  ) {}

  async createCourse(course: CourseDto) {
    const newCourse = this.courseModel.create(course);
    return newCourse;
  }
}
