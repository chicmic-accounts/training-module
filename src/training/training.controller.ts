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
  UpdateTestApproversQueryDto,
} from 'src/common/dtos/create-course.dto';
import { TrainingService } from './training.service';
import { COMMON_RESPONSE } from 'src/common/constants/common-response';
import { MESSAGE } from 'src/common/constants/message';
import { PlanService } from 'src/plan/plan.service';

@Controller('v1/training')
export class TrainingController {
  constructor(
    private trainingService: TrainingService,
  ) {}

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
    @Req() req: any,
  ) {
    body.userId = req.user.userId; /** adding userId to the body  */
    const course = await this.trainingService.updateApprovers(
      body,
      query.courseId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.APPROVER_ADDED, course);
  }

  @Put('course/:id')
  async updateCourse(
    @Param('id') courseId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    body.userId = req.user.userId; /** adding userId to the body  */
    const course = await this.trainingService.updateCourse(courseId, body);
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_UPDATED, course);
  }

  @Delete('course/:id')
  async deleteCourse(@Param('id') courseId: string, @Req() req: any) {
    const course = await this.trainingService.deleteCourse(
      courseId,
      req.user.userId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_DELETED, course);
  }

  @Post('test')
  async createTest(@Body() testDetails: any, @Req() req: any) {
    const test = await this.trainingService.createTest(
      testDetails,
      req.user.userId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.TEST_CREATED, test);
  }

  @Get('test')
  async getAllTests(@Query() query: any) {
    const testsData = await this.trainingService.getTests(query);
    return COMMON_RESPONSE(
      MESSAGE.SUCCESS_MESSAGE.COURSE_FETCHED,
      testsData?.tests,
      testsData?.total,
    );
  }

  @Put('test')
  async updateTestApprovers(
    @Body() body: UpdateApproversDto,
    @Query() query: UpdateTestApproversQueryDto,
    @Req() req: any,
  ) {
    body.userId = req.user.userId; /** adding userId to the body  */
    const course = await this.trainingService.updateTestApprovers(
      body,
      query.testId,
    );
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.TEST_UPDATED, course);
  }

  @Put('test/:id')
  async updateTest(
    @Param('id') testId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    body.userId = req.user.userId; /** adding userId to the body  */
    const course = await this.trainingService.updateTest(testId, body);
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.COURSE_UPDATED, course);
  }

  /** Below are the routes for the Plan */
  @Post('plan')
  async createPlan(@Body() planDetails: any, @Req() req: any) {
    const plan = await this.trainingService.createPlan(planDetails, req.user.userId);
    return COMMON_RESPONSE(MESSAGE.SUCCESS_MESSAGE.PLAN_CREATED, plan);
  }

  @Get('plan')
  async getAllPlans(@Query() query: any) {
    const plansData = await this.trainingService.getPlans(query);
    return COMMON_RESPONSE(
      MESSAGE.SUCCESS_MESSAGE.PLAN_FETCHED,
      plansData?.plans,
      plansData?.total,
    );
  }
}
