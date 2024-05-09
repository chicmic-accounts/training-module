import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { CourseModule } from 'src/course/course.module';
import { PhaseModule } from 'src/phase/phase.module';
import { SubTaskModule } from 'src/sub-task/sub-task.module';
import { TaskModule } from 'src/task/task.module';

@Module({
  imports: [CourseModule, PhaseModule, TaskModule, SubTaskModule],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
