import { IsNotEmpty, IsString } from "class-validator";

export class ClonePlanDto {
    @IsString()
    @IsNotEmpty()
    planId: string;
}