import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trainee } from 'src/common/schemas/trainee.schema';

@Injectable()
export class TraineeService {
    constructor(
        @InjectModel(Trainee.name) private readonly traineeModel: Model<Trainee>,
    ) {}

    /**
     * 
     * @param traineeDetails 
     * @returns 
     */
    async createTrainee(traineeDetails: Trainee) {
        const trainee = await this.traineeModel.create(traineeDetails);
        return trainee;
    }

    /**
     * 
     * @param traineeId 
     * @returns 
     */
    async getTraineeById(traineeId: string) {
        return await this.traineeModel.findById(traineeId).lean();
    }

    /**
     * 
     * @param traineeId 
     * @returns 
     */
    async updateTrainee(traineeId: string, traineeDetails: Trainee) {
        return await this.traineeModel.findByIdAndUpdate(traineeId, traineeDetails, { new: true });
    }
}
