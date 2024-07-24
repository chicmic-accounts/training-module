import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { API_ROUTES } from 'src/common/constants/constant';
import { Plan } from 'src/common/schemas/plan.schema';
import { HttpService } from 'src/common/services/http.service';

@Injectable()
export class PlanService {
    constructor(
        @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
        private httpService: HttpService
    ) { }

    /** FUNCTION IMPLEMENT TO CREATE PLAN */
    async createPlan(planDetails: Plan) {
        const plan = await this.planModel.create(planDetails);
        return plan;
    }

    /** FUNCTION IMPLEMENTED TO GET PLAN */
    async getPlans(query: any) {

        const employees = (await this.httpService.get(API_ROUTES.GET_USERS)).data;
        const plans: any = await this.planModel.aggregate([
            {
                $match: { deleted: false },
            },
            {
                $addFields: {
                    approver: {
                        $map: {
                            input: '$approver',
                            as: 'employeeId',
                            in: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: employees,
                                            as: 'employee',
                                            cond: { $eq: [{ $toString: '$$employee._id' }, '$$employeeId'] },
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'phases',
                    let: { planId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$planId', '$$planId'] },
                                        { $eq: ['$deleted', false] }
                                    ]
                                }
                            }
                        },
                        {
                            $sort: { phaseIndex: -1 }
                        },
                        {
                            $project: {
                                updatedAt: 0,
                                __v: 0,
                                deletedBy: 0,
                                deleted: 0,
                            },
                        },
                        {
                            $lookup: {
                                from: 'tasks',
                                let: { phaseId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$phaseId', '$$phaseId'] },
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $sort: { taskIndex: -1 }
                                    },
                                    {
                                        $project: {
                                            updatedAt: 0,
                                            __v: 0,
                                            deletedBy: 0,
                                            deleted: 0,
                                        },
                                    }
                                ],
                                as: 'tasks',
                            }
                        }
                    ],
                    as: 'phases',
                }
            },
            {
                $facet: {
                    total: [{ $count: 'total' }],
                    plans: [
                        { $sort: { createdAt: -1 } },
                        {
                            $project: {
                                updatedAt: 0,
                                __v: 0,
                                deletedBy: 0,
                                deleted: 0,
                            },
                        },
                    ],
                },
            },
        ]);

        const planData = {
            plans: plans[0].plans,
            total: plans[0].total[0] ? plans[0].total[0].total : 0,
        };

        return planData;
    }

    async getPlanById(planId: string) {
        const plan = await this.planModel.find({ _id: planId, deleted: false }, { createdAt: 0, updatedAt: 0, __v: 0, _id: 0 }).lean();
        return plan;
    }

    async getPlanDetails(planId: string) {
        const plan = await this.planModel.aggregate([
            {
                $match: { _id: new ObjectId(planId), deleted: false },
            },
            {
                $lookup: {
                    from: 'phases',
                    let: { planId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$planId', '$$planId'] },
                                        { $eq: ['$deleted', false] }
                                    ]
                                }
                            }
                        },
                        {
                            $sort: { phaseIndex: -1 }
                        },
                        {
                            $project: {
                                updatedAt: 0,
                                __v: 0,
                                deletedBy: 0,
                                deleted: 0,
                            },
                        },
                        {
                            $lookup: {
                                from: 'tasks',
                                let: { phaseId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$phaseId', '$$phaseId'] },
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $sort: { taskIndex: -1 }
                                    },
                                    {
                                        $project: {
                                            updatedAt: 0,
                                            __v: 0,
                                            deletedBy: 0,
                                            deleted: 0,
                                        },
                                    }
                                ],
                                as: 'tasks',
                            }
                        }
                    ],
                    as: 'phases',
                }
            },
            {
                $project: {
                    updatedAt: 0,
                    __v: 0,
                    deletedBy: 0,
                    deleted: 0,
                },
            },
        ]);
        return { plans: plan[0] }
    }

    async updatePlan(updatedPlan: any, userId: string, planId: string) {
        const plan = await this.planModel.findOneAndUpdate(
            { _id: planId, deleted: false },
            {
                $set: {
                    ...updatedPlan,
                    updatedBy: userId,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );
        return plan;
    }

    /**
     * 
     * @param planId 
     * @param userId 
     * @returns 
     */
    async deletePlan(planId: string, userId: string) {
        const plan = await this.planModel.findOneAndUpdate(
            { _id: planId, deleted: false },
            {
                $set: {
                    deleted: true,
                    deletedBy: userId
                },
            },
            { new: true },
        );
        return plan;
    }
}
