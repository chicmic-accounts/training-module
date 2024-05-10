import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseSchema } from 'src/common/schemas/course.schema';
import { HttpService } from 'src/common/services/http.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Course', schema: CourseSchema }]),
  ],
  providers: [CourseService, HttpService],
  controllers: [CourseController],
  exports: [CourseService],
})
export class CourseModule {}
