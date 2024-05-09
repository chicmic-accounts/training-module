import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
}
