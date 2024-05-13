import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdatePhaseDto } from 'src/common/dtos/create-course.dto';
import { Phase } from 'src/common/schemas/phase.schema';

@Injectable()
export class PhaseService {
  constructor(
    @InjectModel(Phase.name) private readonly phaseModel: Model<Phase>,
  ) {}

  async createPhase(phaseDetails: Phase[]) {
    const phase = this.phaseModel.create(phaseDetails);
    return phase;
  }

  /**Function implemented to update phase  */
  async updatePhase(phaseDetails: UpdatePhaseDto) {
    const phase = this.phaseModel.findByIdAndUpdate(
      phaseDetails._id,
      phaseDetails,
      { new: true },
    );
    return phase;
  }
}
