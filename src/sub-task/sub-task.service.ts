import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
}
