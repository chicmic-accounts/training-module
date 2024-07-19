import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanSchema } from 'src/common/schemas/plan.schema';
import { HttpService } from 'src/common/services/http.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plan', schema: PlanSchema }]),
  ],
  providers: [PlanService, HttpService],
  exports: [PlanService],
})
export class PlanModule {}
