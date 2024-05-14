import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { DEFAULT_PAGINATION } from 'src/common/constants/constant';
import { CourseDto } from 'src/common/dtos/create-course.dto';
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
    } else {
      courseData = await this.getAllCourses(query);

      // Iterate through courses and replace user IDs with names
      courseData.courses.forEach((course) => {
        course['createdByName'] = userIdToNameMap[course?.createdBy]?.name;
        course['approver'] = course?.approver?.map((approverId) => {
          return userIdToNameMap[approverId];
        });
      });
    }

    return courseData;
  }

  /** FUNCTION IMPLEMENTED TO GET ALL THE COURSES */
  async getAllCourses(query: any) {
    const courses = await this.courseModel.aggregate([
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
            { $match: { $expr: { $eq: ['$courseId', '$$courseId'] } } },
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
  async updateApprovers(approvers: string[], courseId: string) {
    return await this.courseModel.findByIdAndUpdate(
      { _id: courseId },
      { approver: approvers },
    );
  }

  /** FUNCTION IMPLEMENTED TO DELETE COURSE */
  async deleteCourse(courseId: string, userId: string) {
    return await this.courseModel.findByIdAndUpdate(
      { _id: courseId },
      { deleted: true, deletedBy: userId },
    );
  }
}
