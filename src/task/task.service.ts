import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Task } from 'src/common/schemas/task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
  ) {}

  async createTask(taskDetails: Task[]) {
    try {
      return await this.taskModel.create(taskDetails);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  /** FUNCTION IMPLEMENTED TO GET TASK ON THE BASIS OF PHASES */
  async getTasks(phaseId: string) {
    return await this.taskModel.find({
      phaseId: phaseId,
      deleted: false,
    });
  }

  /** FUNCTION TO IMPLEMENT UPDATE TASK */
  async updateTask(taskDetails: Task, taskId: string) {
    return await this.taskModel.findOneAndUpdate({ _id: taskId }, taskDetails, {
      new: true,
    });
  }

  /** FUNCTION TO IMPLEMENT DELETE TASK */
  async deleteTask(taskId: ObjectId, userId: string) {
    return await this.taskModel.findOneAndUpdate(
      { _id: taskId },
      { deleted: true, deletedBy: userId },
      { new: true },
    );
  }

  /**
   * 
   * @param planId 
   * @returns 
   * 
   * FUNCTION TO GET TASKS ON THE BASIS OF PLAN
   */
  async getTasksByPlan(planId: string) {
    return await this.taskModel.aggregate([
      {
        $match: { planId: new ObjectId(planId), deleted: false },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          deleted: 0,
          deletedBy: 0,
        }
      }
    ]);
  }
}
