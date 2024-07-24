import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { TRAINEE_STATUS } from "../constants/constant";

@Schema()
export class Trainee {

    @Prop({ required: true })
    _id: ObjectId;

    @Prop({ required: true })
    assignedPlan: string[];

    @Prop({ default: TRAINEE_STATUS.PENDING })
    status?: number;

    @Prop({ default: new Date()})
    startDate: Date;

    @Prop({ default: 0 })
    rating?: number;
}

export const TraineeSchema = SchemaFactory.createForClass(Trainee);