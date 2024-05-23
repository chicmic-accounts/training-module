import { Module } from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MilestoneSchema } from 'src/common/schemas/milestone.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Milestone', schema: MilestoneSchema }]),
  ],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}
