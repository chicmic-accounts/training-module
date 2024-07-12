import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { UpdateMilestoneDto } from 'src/common/dtos/test.dto';
import { Milestone } from 'src/common/schemas/milestone.schema';

@Injectable()
export class MilestoneService {
  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
  ) {}

  async createMilestone(milestoneDetails: Milestone[]) {
    const Milestone = this.milestoneModel.create(milestoneDetails);
    return Milestone;
  }

  /**Function implemented to update Milestone  */
  async updateMilestone(milestoneDetails: UpdateMilestoneDto, phaseId: string) {
    const Milestone = await this.milestoneModel.findOneAndUpdate(
      { _id: phaseId },
      milestoneDetails,
      { new: true },
    );
    return Milestone;
  }

  /** FUNCTION IMPLEMENTED TO GET PHASES ON THE BASIS OF COURSE */
  async getMilestone(test: { testId: string }) {
    const milestone = await this.milestoneModel.find({
      courseId: new ObjectId(test.testId),
      deleted: false,
    });
    return milestone;
  }

  /** FUNCTION IMPLEMENTED TO DELETE Milestone */
  async deleteMilestone(milestoneId: string, userId: string) {
    const Milestone = await this.milestoneModel.findOneAndUpdate(
      { _id: milestoneId },
      { deleted: true, deletedBy: userId },
      { new: true },
    );
    return Milestone;
  }
}
