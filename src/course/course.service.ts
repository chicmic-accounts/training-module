import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { DEFAULT_PAGINATION } from 'src/common/constants/constant';
import { MESSAGE } from 'src/common/constants/message';
import {
  CourseDto,
  UpdateApproversDto,
} from 'src/common/dtos/create-course.dto';
import { Course } from 'src/common/schemas/course.schema';
import { HttpService } from 'src/common/services/http.service';

@Injectable()
export class CourseService {
  constructor(
    // Inject the CourseModel token
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    private readonly httpService: HttpService,
  ) {}

  /** FUNCTION IMPLEMENTED TO CREATE COURSE */
  async createCourse(course: CourseDto) {
    const newCourse = this.courseModel.create(course);
    return newCourse;
  }

  /** COMMON FUNCTION TO GET COURSE */
  async getCourse(query: any) {
    // Set default values for pagination
    query.sortKey = query?.sortKey || 'createdAt';
    query.sortDirection = +query?.sortDirection || -1;
    query.index = +query?.index || DEFAULT_PAGINATION.SKIP;
    query.limit = +query?.limit || DEFAULT_PAGINATION.LIMIT;

    const userDataResponse = await this.httpService.get('v1/dropdown/user');
    const userData = userDataResponse.data; // Assuming user data is in userData.data or similar format

    // Create a map of user IDs to names
    const userIdToNameMap = {};
    userData.forEach((user) => {
      userIdToNameMap[user._id] = { name: user.name, _id: user._id };
    });

    let courseData;
    if (query?.courseId) {
      courseData = await this.getCourseById(query.courseId);

      courseData.courses['approver'] = courseData?.courses?.approver?.map(
        (approverId) => {
          return userIdToNameMap[approverId];
        },
      );

      /**DONE TO TRANSFORM TIME  */
      courseData.courses['phases']?.forEach((phase) => {
        phase.allocatedTime = this.secondsToHHMM(phase.allocatedTime);
        phase['tasks']?.forEach((task) => {
          task.allocatedTime = this.secondsToHHMM(task.allocatedTime);
          task['subtasks']?.forEach((subtask) => {
            subtask.estimatedTime = this.secondsToHHMM(subtask.estimatedTime);
          });
        });
      });
    } else {
      courseData = await this.getAllCourses(query);

      // Iterate through courses and replace user IDs with names
      courseData.courses.forEach((course) => {
        course['createdByName'] = userIdToNameMap[course?.createdBy]?.name;
        course['approver'] = course?.approver?.map((approverId) => {
          return userIdToNameMap[approverId];
        });
        course['approvedBy'] = course?.approvedBy?.map((approverId) => {
          return userIdToNameMap[approverId];
        });
      });
    }

    return courseData;
  }

  /** FUNCTION IMPLEMENTED TO GET ALL THE COURSES */
  async getAllCourses(query: any) {
    const courses = await this.courseModel.aggregate([
      { $match: { deleted: false } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          courseData: [
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

    const courseData = {
      courses: courses[0].courseData,
      total: courses[0].totalCount[0]?.total || 0,
    };

    return courseData;
  }

  /**FETCH COURSE BY ID */
  async getCourseById(id: ObjectId) {
    id = new ObjectId(id);
    const course = await this.courseModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'phases',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$courseId', '$$courseId'] },
                    { $eq: ['$deleted', false] },
                  ],
                },
              },
            },
            { $sort: { phaseIndex: 1 } },
            {
              $lookup: {
                from: 'tasks',
                let: { phaseId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$phaseId', '$$phaseId'] } } },
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
          as: 'phases',
        },
      },
    ]);
    return {
      courses: course[0],
      total: 1,
    };
  }

  /** FUNCTION IMPLEMENTED TO UPDATE COURSE APPROVERS */
  async updateApprovers(body: UpdateApproversDto, courseId: string) {
    if (body?.approved) {
      const course = await this.courseModel.findOne({ _id: courseId });
      if (!course) {
        throw new HttpException(
          MESSAGE.ERROR_MESSAGE.COURSE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (course.approvedBy.includes(body.userId)) {
        throw new HttpException(
          MESSAGE.ERROR_MESSAGE.APPROVER_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }

      /** ADDING NEW APPROVER TO THE APPROVED BY LIST  */
      course.approvedBy.push(body.userId);
      body['approvedBy'] = course.approvedBy;
    }

    return await this.courseModel.findByIdAndUpdate({ _id: courseId }, body, {
      new: true,
    });
  }

  /** FUNCTION IMPLEMENTED TO DELETE COURSE */
  async deleteCourse(courseId: string, userId: string) {
    return await this.courseModel.findByIdAndUpdate(
      { _id: courseId },
      { deleted: true, deletedBy: userId },
    );
  }

  /** FUNCTION IMPLEMENTED TO UPDATE A COURSE */
  async updateCourse(updatedCourseDetails: any, courseId: string) {
    return await this.courseModel.findByIdAndUpdate(
      { _id: courseId },
      updatedCourseDetails,
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
