import { Body, Controller, Post } from '@nestjs/common';
import { CreateCourseDto } from 'src/common/dtos/create-course.dto';
import { TrainingService } from './training.service';
import { COMMON_RESPONSE } from 'src/common/constants/common-response';
import { MESSAGE } from 'src/common/constants/message';

@Controller('v1/training')
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  @Post('course')
  async createCourse(@Body() courseDetails: CreateCourseDto) {
    const course = await this.trainingService.createCourse(courseDetails);
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_CREATED, course);
  }
}
