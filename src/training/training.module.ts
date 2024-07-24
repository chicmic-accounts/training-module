import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { CourseModule } from 'src/course/course.module';
import { PhaseModule } from 'src/phase/phase.module';
import { SubTaskModule } from 'src/sub-task/sub-task.module';
import { TaskModule } from 'src/task/task.module';
import { HttpService } from 'src/common/services/http.service';
import { TestModule } from 'src/test/test.module';
import { MilestoneModule } from 'src/milestone/milestone.module';
import { PlanModule } from 'src/plan/plan.module';
import { TraineeModule } from 'src/trainee/trainee.module';

@Module({
  imports: [
    CourseModule,
    PhaseModule,
    TaskModule,
    SubTaskModule,
    TestModule,
    MilestoneModule,
    PlanModule,
    TraineeModule
  ],
  controllers: [TrainingController],
  providers: [TrainingService, HttpService],
})
export class TrainingModule {}
