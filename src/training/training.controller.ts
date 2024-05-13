import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  CreateCourseDto,
  UpdateApproversDto,
  UpdateApproversQueryDto,
} from 'src/common/dtos/create-course.dto';
import { TrainingService } from './training.service';
import { COMMON_RESPONSE } from 'src/common/constants/common-response';
import { MESSAGE } from 'src/common/constants/message';

@Controller('v1/training')
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  @Post('course')
  async createCourse(@Body() courseDetails: CreateCourseDto, @Req() req: any) {
    const course = await this.trainingService.createCourse(
      courseDetails,
      req.user.userId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_CREATED, course);
  }

  @Get('course')
  async getAllCourses(@Query() query: any) {
    const coursesData = await this.trainingService.getAllCourses(query);
    return COMMON_RESPONSE(
      MESSAGE.SUCCESS_MESSAGE.COURSE_FETCHED,
      coursesData?.courses,
      coursesData?.total,
    );
  }

  @Put('course')
  async updateApprovers(
    @Body() body: UpdateApproversDto,
    @Query() query: UpdateApproversQueryDto,
  ) {
    const course = await this.trainingService.updateApprovers(
      body.approver,
      query.courseId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.APPROVER_ADDED, course);
  }

  @Delete('course/:id')
  async deleteCourse(@Param('id') courseId: string) {
    const course = await this.trainingService.deleteCourse(courseId);
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_DELETED, course);
  }
}
