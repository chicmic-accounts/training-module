import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { SubTask } from 'src/common/schemas/subtask.schema';

@Injectable()
export class SubTaskService {
  constructor(
    @InjectModel('SubTask') private readonly subTaskModel: Model<SubTask>,
  ) {}

  async createSubTask(subTaskDetails: any) {
    try {
      return await this.subTaskModel.create(subTaskDetails);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getSubTasks(taskId: string) {
    return await this.subTaskModel.find({
      taskId: taskId,
      deleted: false,
    });
  }

  async updateSubTask(subTaskDetails: any, subTaskId: string) {
    return await this.subTaskModel.findOneAndUpdate(
      { _id: subTaskId },
      subTaskDetails,
      { new: true },
    );
  }

  async deleteSubTask(subTaskId: ObjectId, userId: string) {
    return await this.subTaskModel.findOneAndUpdate(
      { _id: subTaskId },
      { deleted: true, deletedBy: userId },
      { new: true },
    );
  }
}
