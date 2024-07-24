import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
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
  async updatePhase(phaseDetails: UpdatePhaseDto, phaseId: string) {
    const phase = await this.phaseModel.findOneAndUpdate(
      { _id: phaseId },
      phaseDetails,
      { new: true },
    );
    return phase;
  }

  /** FUNCTION IMPLEMENTED TO GET PHASES ON THE BASIS OF COURSE */
  async getPhases(course: { courseId: string }) {
    const phases = await this.phaseModel.find({
      courseId: new ObjectId(course.courseId),
      deleted: false,
    });
    return phases;
  }

  /** FUNCTION IMPLEMENTED TO DELETE PHASE */
  async deletePhase(phaseId: string, userId: string) {
    const phase = await this.phaseModel.findOneAndUpdate(
      { _id: phaseId },
      { deleted: true, deletedBy: userId },
      { new: true },
    );
    return phase;
  }

  /** FUNCTION IMPLEMENTED TO GET PHASES OF PLANS */
  async getPhasesByPlan(planId: string) {
    const phases = await this.phaseModel.aggregate([
      {
        $match: { planId: new ObjectId(planId), deleted: false },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
          createdBy: 0,
          deleted: 0,
          deletedBy: 0,
        },
      }
    ]);
    return phases;
  }
}
