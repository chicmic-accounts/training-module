import { Module } from '@nestjs/common';
import { TraineeService } from './trainee.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TraineeSchema } from 'src/common/schemas/trainee.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Trainee', schema: TraineeSchema }])],
  providers: [TraineeService],
  exports: [TraineeService],
})
export class TraineeModule {}
