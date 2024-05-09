import { Module } from '@nestjs/common';
import { SubTaskService } from './sub-task.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SubTaskSchema } from 'src/common/schemas/subtask.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'SubTask', schema: SubTaskSchema }]),
  ],
  providers: [SubTaskService],
  exports: [SubTaskService],
})
export class SubTaskModule {}
