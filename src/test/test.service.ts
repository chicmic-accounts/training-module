import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { DEFAULT_PAGINATION } from 'src/common/constants/constant';
import { MESSAGE } from 'src/common/constants/message';
import { TestDto, UpdateApproversDto } from 'src/common/dtos/test.dto';
import { Test } from 'src/common/schemas/test.schema';
import { HttpService } from 'src/common/services/http.service';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(Test.name) private testModel: Model<Test>,
    private readonly httpService: HttpService,
  ) {}

  /** FUNCTION IMPLEMENTED TO CREATE COURSE */
  async createTest(test: TestDto) {
    try {
      const newTest = await this.testModel.create(test);
      return newTest;
    } catch (error) {
      throw new HttpException(
        error.message || MESSAGE.ERROR_MESSAGE.TEST_CREATION_FAILED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** COMMON FUNCTION TO GET COURSE */
  async getTests(query: any) {
    // Set default values for pagination
    query.sortKey = query?.sortKey || 'createdAt';
    query.sortDirection = +query?.sortDirection || -1;
    query.index = +query?.index || DEFAULT_PAGINATION.SKIP;
    query.limit = +query?.limit || DEFAULT_PAGINATION.LIMIT;

    const userDataResponse = await this.httpService.get('v1/dropdown/user');
    const teamsDataResponse = await this.httpService.get('v1/dropdown/team');
    const teamsData = teamsDataResponse?.data?.data; // Assuming team data is in teamsData.data or similar format
    const userData = userDataResponse.data; // Assuming user data is in userData.data or similar format

    // Create a map of user IDs to names
    const userIdToNameMap = {};
    const teamIdToTeamMap = {};
    userData.forEach((user) => {
      userIdToNameMap[user._id] = { name: user.name, _id: user._id };
    });

    teamsData.forEach((user) => {
      teamIdToTeamMap[user._id] = { name: user.name, _id: user._id };
    });

    let testData;
    if (query?.testId) {
      testData = await this.getTestById(query.testId);

      testData.tests['approver'] = testData?.tests?.approver?.map(
        (approverId) => {
          return userIdToNameMap[approverId];
        },
      );

      testData.tests['teams'] = testData?.tests?.teams?.map((teamId) => {
        return teamIdToTeamMap[teamId];
      });

      testData.tests['approvedBy'] = testData?.tests?.approvedBy?.map(
        (teamId) => {
          return userIdToNameMap[teamId];
        },
      );

      /**DONE TO TRANSFORM TIME  */
      testData.tests['milestones']?.forEach((milestone) => {
        milestone.allocatedTime = this.secondsToHHMM(milestone.allocatedTime);
        milestone['tasks']?.forEach((task) => {
          task.allocatedTime = this.secondsToHHMM(task.allocatedTime);
          task['subtasks']?.forEach((subtask) => {
            subtask.estimatedTime = this.secondsToHHMM(subtask.estimatedTime);
          });
        });
      });
    } else {
      testData = await this.getAllTests(query);
      // Iterate through courses and replace user IDs with names
      testData.tests.forEach((test) => {
        test['createdByName'] = userIdToNameMap[test?.createdBy]?.name;
        test['approver'] = test?.approver?.map((approverId) => {
          return userIdToNameMap[approverId];
        });
        test['approvedBy'] = test?.approvedBy?.map((approverId) => {
          return userIdToNameMap[approverId];
        });
        test['teams'] = test?.teams?.map((teamId) => {
          return teamIdToTeamMap[teamId];
        });
      });
    }

    return testData;
  }

  /** FUNCTION IMPLEMENTED TO GET ALL THE COURSES */
  async getAllTests(query: any) {
    const tests = await this.testModel.aggregate([
      { $match: { deleted: false } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          testData: [
            { $sort: { [query.sortKey]: query.sortDirection } },
            { $skip: query?.index },
            { $limit: query?.limit },
            {
              $project: {
                createdAt: 0,
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

    const testData = {
      tests: tests[0].testData,
      total: tests[0].totalCount[0]?.total || 0,
    };

    return testData;
  }

  /**FETCH COURSE BY ID */
  async getTestById(id: ObjectId) {
    id = new ObjectId(id);
    const test = await this.testModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'milestones',
          let: { testId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$testId', '$$testId'] },
                    { $eq: ['$deleted', false] },
                  ],
                },
              },
            },
            { $sort: { milestoneIndex: 1 } },
            {
              $lookup: {
                from: 'tasks',
                let: { milestoneId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$milestoneId', '$$milestoneId'] },
                    },
                  },
                  { $sort: { taskIndex: 1 } },
                  {
                    $lookup: {
                      from: 'subtasks',
                      let: { taskId: '$_id' },
                      pipeline: [
                        { $match: { $expr: { $eq: ['$taskId', '$$taskId'] } } },
                        { $sort: { subTaskIndex: 1 } },
                        {
                          $project: {
                            __v: 0,
                            courseId: 0,
                            phaseId: 0,
                            taskId: 0,
                            subTaskIndex: 0,
                            createdAt: 0,
                            updatedAt: 0,
                          },
                        },
                      ],
                      as: 'subtasks',
                    },
                  },
                  {
                    $project: {
                      __v: 0,
                      courseId: 0,
                      phaseId: 0,
                      taskId: 0,
                      taskIndex: 0,
                      createdAt: 0,
                      updatedAt: 0,
                    },
                  },
                ],
                as: 'tasks',
              },
            },
            {
              $project: {
                __v: 0,
                courseId: 0,
                createdAt: 0,
                updatedAt: 0,
                phaseIndex: 0,
              },
            },
          ],
          as: 'milestones',
        },
      },
    ]);
    return {
      tests: test[0],
      total: 1,
    };
  }

  /** FUNCTION IMPLEMENTED TO UPDATE COURSE APPROVERS */
  async updateApprovers(body: UpdateApproversDto, testId: string) {
    if (body?.approved) {
      const test = await this.testModel.findOne({ _id: testId });
      if (!test) {
        throw new HttpException(
          MESSAGE.ERROR_MESSAGE.COURSE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (test.approvedBy.includes(body.userId)) {
        throw new HttpException(
          MESSAGE.ERROR_MESSAGE.APPROVER_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }

      /** ADDING NEW APPROVER TO THE APPROVED BY LIST  */
      test.approvedBy.push(body.userId);
      body['approvedBy'] = test.approvedBy;
    }

    return await this.testModel.findByIdAndUpdate({ _id: testId }, body, {
      new: true,
    });
  }

  /** FUNCTION IMPLEMENTED TO DELETE COURSE */
  async deleteTest(testId: string, userId: string) {
    return await this.testModel.findByIdAndUpdate(
      { _id: testId },
      { deleted: true, deletedBy: userId },
    );
  }

  /** FUNCTION IMPLEMENTED TO UPDATE A COURSE */
  async updateTest(updatedTestDetails: any, testId: string) {
    return await this.testModel.findByIdAndUpdate(
      { _id: testId },
      updatedTestDetails,
      { new: true },
    );
  }

  /** FUNCTION IMPLEMENTED TO TRANSFORM TIME IN HH:MM FORMAT */
  secondsToHHMM(seconds) {
    // Ensure seconds is a number
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      throw new Error(
        'Invalid input. Please provide a valid number of seconds.',
      );
    }

    // Calculate hours and minutes
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // Format hours and minutes
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    // Return formatted time
    return `${formattedHours}:${formattedMinutes}`;
  }
}
