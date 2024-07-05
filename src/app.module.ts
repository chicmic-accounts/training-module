import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CourseModule } from './course/course.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PhaseModule } from './phase/phase.module';
import { TaskModule } from './task/task.module';
import { SubTaskModule } from './sub-task/sub-task.module';
import { TrainingModule } from './training/training.module';
import { HttpService } from './common/services/http.service';
import { TestModule } from './test/test.module';
import { MilestoneModule } from './milestone/milestone.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [
    /** FOR CONFIGURATION OF ENV FILES */
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.DB_URI) /** FOR DB CONNECTIONS */,
    CourseModule,
    PhaseModule,
    TaskModule,
    SubTaskModule,
    TrainingModule,
    TestModule,
    MilestoneModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [AppService, HttpService],
  exports: [HttpService],
})
export class AppModule {}
