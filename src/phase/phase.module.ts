import { Module } from '@nestjs/common';
import { PhaseService } from './phase.service';
import { PhaseSchema } from 'src/common/schemas/phase.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Phase', schema: PhaseSchema }]),
  ],
  providers: [PhaseService],
  exports: [PhaseService],
})
export class PhaseModule {}
