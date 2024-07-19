import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import {
  CourseDto,
  CreateCourseDto,
  UpdateApproversDto,
  UpdateCourseDto,
  UpdatePhaseDto,
} from 'src/common/dtos/create-course.dto';
import { CreateTestDto, TestDto, UpdateMilestoneDto, UpdateTestDto } from 'src/common/dtos/test.dto';
import { CourseService } from 'src/course/course.service';
import { MilestoneService } from 'src/milestone/milestone.service';
import { PhaseService } from 'src/phase/phase.service';
import { PlanService } from 'src/plan/plan.service';
import { SubTaskService } from 'src/sub-task/sub-task.service';
import { TaskService } from 'src/task/task.service';
import { TestService } from 'src/test/test.service';

@Injectable()
export class TrainingService {
  constructor(
    private courseService: CourseService,
    private testService: TestService,
    private phaseService: PhaseService,
    private taskService: TaskService,
    private subTaskService: SubTaskService,
    private milestoneService: MilestoneService,
    private planService: PlanService,
  ) {}

  /** FUNCTION IMPLEMENTED CALCULATE TIME */
  calculateTime = (phases) =>
    phases
      .flatMap((phase) => phase.tasks.flatMap((task) => task.subtasks))
      .reduce(
        (acc, subTask) => acc + this.timeStringToSeconds(subTask.estimatedTime),
        0,
      );

  /** FUNCTION IMPLEMENTED TO CREATE A COURSE */
  async createCourse(courseDetails: CreateCourseDto, userId: string) {
    const totalTime = this.calculateTime(courseDetails.phases);

    const course: CourseDto = {
      ...courseDetails,
      createdBy: userId,
      totalPhases: courseDetails.phases.length,
      noOfTopics: courseDetails.phases.reduce(
        (acc, phase) =>
          acc +
          phase.tasks.reduce((acc, task) => acc + task.subtasks.length, 0),
        0,
      ),
      estimatedTime: totalTime,
    };

    const createdCourse = await this.courseService.createCourse(course);

    const phases = courseDetails.phases.map((phase, index) => ({
      name: phase.name,
      allocatedTime: this.calculateTime([phase]),
      courseId: createdCourse._id,
      phaseIndex: index,
    }));

    const createdPhases = await this.phaseService.createPhase(phases);

    const tasks = courseDetails.phases.flatMap((phase, index) =>
      phase.tasks.map((task, taskIndex) => ({
        mainTask: task.mainTask,
        allocatedTime: this.calculateTime([{ ...phase, tasks: [task] }]),
        phaseId: createdPhases[index]._id,
        courseId: createdCourse._id,
        taskIndex,
      })),
    );

    const createdTasks = await this.taskService.createTask(
      tasks.map((task) => ({ ...task, milestoneId: null })),
    );

    const subTasks = courseDetails.phases.flatMap((phase, index) =>
      phase.tasks.flatMap((task, taskIndex) =>
        task.subtasks.map((subTask, subTaskIndex) => ({
          ...subTask,
          estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
          courseId: createdCourse._id,
          phaseId: createdPhases[index]._id,
          taskId: createdTasks.filter(
            (task) => task.phaseId === createdPhases[index]._id,
          )[taskIndex]._id,
          subTaskIndex,
        })),
      ),
    );

    await this.subTaskService.createSubTask(subTasks);

    return { createdCourse, phases, tasks, subTasks };
  }

  /** FUNCION IMPLEMENTED TO CONVERT STRING TIME TO SECONDS */
  timeStringToSeconds(timeString) {
    // Split the time string into hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a new date object with the given hours and minutes
    const date = new Date(0, 0, 0, hours, minutes);

    // Calculate the total number of seconds
    const totalSeconds = date.getHours() * 3600 + date.getMinutes() * 60;

    return totalSeconds;
  }

  /** FUNCTION IMPLEMENTED TO FETCH ALL COURSES */
  async getAllCourses(query: any) {
    return await this.courseService.getCourse(query);
  }

  /** FUNCTION IMPLEMENTED TO UPDATE APPROVERS */
  async updateApprovers(body: UpdateApproversDto, courseId: string) {
    return await this.courseService.updateApprovers(body, courseId);
  }

  /** FUNCTION IMPLEMENTED TO DELETE COURSE */
  async deleteCourse(courseId: string, userId: string) {
    return await this.courseService.deleteCourse(courseId, userId);
  }

  /**FUNCTION IMPLEMENTED TO UPDATE COURSE */
  async updateCourse(courseId: string, body: UpdateCourseDto) {
    const updatedCourseDetails = {
      courseName: body.courseName,
      figmaLink: body.figmaLink,
      guidelines: body.guidelines,
      approver: body.approver,
      updatedBy: body.userId,
      totalPhases: body.phases.length,
      estimatedTime: this.calculateTime(body.phases),
      noOfTopics: body.phases.reduce(
        (acc, phase) =>
          acc +
          phase.tasks.reduce((acc, task) => acc + task.subtasks.length, 0),
        0,
      ),
    };

    await this.courseService.updateCourse(updatedCourseDetails, courseId);

    const previousPhases = (
      await this.phaseService.getPhases({ courseId })
    ).map((phase) => phase._id.toString());

    const updatedPhasesPromises = body.phases.map(async (phase) => {
      const updatedPhase: UpdatePhaseDto = {
        name: phase.name,
        allocatedTime: this.calculateTime([phase]),
        phaseIndex: body.phases.indexOf(phase),
        courseId: new ObjectId(courseId),
        tasks: phase.tasks,
      };

      let updatedPhaseDetails;
      if (phase?.['_id']) {
        updatedPhaseDetails = await this.phaseService.updatePhase(
          updatedPhase,
          phase['_id'],
        );
      } else {
        updatedPhaseDetails = await this.phaseService.createPhase([
          updatedPhase,
        ]);
        updatedPhaseDetails = updatedPhaseDetails[0];
        previousPhases.push(updatedPhaseDetails._id);
      }

      updatedPhaseDetails.tasks = phase.tasks;
      return updatedPhaseDetails;
    });

    let updatedPhases = await Promise.all(updatedPhasesPromises);

    const phasesToDelete = previousPhases.filter(
      (phaseId) =>
        !updatedPhases.some((phase) => phase._id == phaseId.toString()),
    );

    await Promise.all(
      phasesToDelete.map((phase) =>
        this.phaseService.deletePhase(phase, body.userId),
      ),
    );

    const updateTasksPromises = updatedPhases.map(async (phase) => {
      const updatedTasks = await Promise.all(
        phase.tasks.map(async (task, index) => {
          const updatedTask = {
            mainTask: task.mainTask,
            allocatedTime: this.calculateTime([{ ...phase, tasks: [task] }]),
            phaseId: phase._id,
            courseId: new ObjectId(courseId),
            taskIndex: index,
          };

          let updatedTaskDetails;
          if (task?.['_id']) {
            updatedTaskDetails = await this.taskService.updateTask(
              {
                ...updatedTask,
                milestoneId: task.milestoneId,
              },
              task['_id'],
            );
          } else {
            updatedTaskDetails = await this.taskService.createTask([
              {
                ...updatedTask,
                milestoneId: task.milestoneId,
              },
            ]);
            updatedTaskDetails = updatedTaskDetails[0];
          }
          updatedTaskDetails.subtasks = task.subtasks;
          return updatedTaskDetails;
        }),
      );

      phase.tasks = updatedTasks;
      return phase;
    });

    updatedPhases = await Promise.all(updateTasksPromises);

    const updateSubTasksPromises = updatedPhases.map(async (phase) => {
      for (const task of phase.tasks) {
        const updatedSubTasks = await Promise.all(
          task.subtasks.map(async (subTask, index) => {
            const updatedSubTask = {
              subTask: subTask.subTask,
              link: subTask.link,
              estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
              courseId: courseId,
              phaseId: phase._id,
              taskId: task._id,
              subTaskIndex: index,
            };

            let updatedSubTaskDetails;
            if (subTask?.['_id']) {
              updatedSubTaskDetails = await this.subTaskService.updateSubTask(
                updatedSubTask,
                subTask['_id'],
              );
            } else {
              updatedSubTaskDetails = await this.subTaskService.createSubTask([
                updatedSubTask,
              ]);
              updatedSubTaskDetails = updatedSubTaskDetails[0];
            }
            return updatedSubTaskDetails;
          }),
        );

        task.subtasks = updatedSubTasks;
      }
      return phase;
    });

    updatedPhases = await Promise.all(updateSubTasksPromises);

    return updatedPhases;
  }

  /** FUNCTION IMPLEMENTED TO CREATE TEST */
  async createTest(testDetails: CreateTestDto, userId: string) {
    const totalTime = this.calculateTime(testDetails.milestones);

    const test: TestDto = {
      ...testDetails,
      createdBy: userId,
      totalMilestones: testDetails.milestones.length,
      noOfTopics: testDetails.milestones.reduce(
        (acc, milestone) =>
          acc +
          milestone.tasks.reduce((acc, task) => acc + task.subtasks.length, 0),
        0,
      ),
      estimatedTime: totalTime,
    };

    const createdTest = await this.testService.createTest(test);

    const milestones = testDetails.milestones.map((milestone, index) => ({
      name: milestone.name,
      allocatedTime: this.calculateTime([milestone]),
      testId: createdTest._id,
      milestoneIndex: index,
    }));

    const createdMilestones =
      await this.milestoneService.createMilestone(milestones);

    const tasks = testDetails.milestones.flatMap((milestone, index) =>
      milestone.tasks.map((task, taskIndex) => ({
        mainTask: task.mainTask,
        allocatedTime: this.calculateTime([{ ...milestone, tasks: [task] }]),
        milestoneId: createdMilestones[index]._id,
        testId: createdTest._id,
        taskIndex,
      })),
    );

    const createdTasks = await this.taskService.createTask(
      tasks.map((task, taskIndex) => ({
        ...task,
        phaseId: createdMilestones[taskIndex]._id,
      })),
    );

    const subTasks = testDetails.milestones.flatMap((phase, index) =>
      phase.tasks.flatMap((task, taskIndex) =>
        task.subtasks.map((subTask, subTaskIndex) => ({
          ...subTask,
          estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
          courseId: createdTest._id,
          phaseId: createdMilestones[index]._id,
          taskId: createdTasks.filter(
            (task) => task.phaseId === createdMilestones[index]._id,
          )[taskIndex]._id,
          subTaskIndex,
        })),
      ),
    );

    await this.subTaskService.createSubTask(subTasks);

    return { createdTest, milestones, tasks, subTasks };
  }

  /** FUNCTION IMPLEMENTED TO GET TEST */
  async getTests(query: any) {
    return await this.testService.getTests(query);
  }

  /** FUNCTION IMPLEMENTED TO UPDATE APPROVERS */
  async updateTestApprovers(body: UpdateApproversDto, testId: string) {
    return await this.testService.updateApprovers(body, testId);
  }

  /** FUNCTION IMPLEMENTED TO UPDATE TEST DETAILS */
  async updateTest(testId: string, body: UpdateTestDto) {
    const updatedTestDetails = {
      testName: body.testName,
      approver: body.approver,
      updatedBy: body.userId,
      totalMilestones: body.milestones.length,
      estimatedTime: this.calculateTime(body.milestones),
      noOfTopics: body.milestones.reduce(
        (acc, phase) =>
          acc +
          phase.tasks.reduce((acc, task) => acc + task.subtasks.length, 0),
        0,
      ),
    };

    await this.testService.updateTest(updatedTestDetails, testId);

    const previousMilestone = (
      await this.milestoneService.getMilestone({ testId })
    ).map((phase) => phase._id.toString());

    const updatedMilstonessPromises = body.milestones.map(async (milestone) => {
      const updatedMilestone: UpdateMilestoneDto = {
        name: milestone.name,
        allocatedTime: this.calculateTime([milestone]),
        milestoneIndex: body.milestones.indexOf(milestone),
        testId: new ObjectId(testId),
        tasks: milestone.tasks,
      };

      let updatedMilestoneDetails;
      if (milestone?.['_id']) {
        updatedMilestoneDetails = await this.milestoneService.updateMilestone(
          updatedMilestone,
          milestone['_id'],
        );
      } else {
        updatedMilestoneDetails = await this.milestoneService.createMilestone([
          updatedMilestone,
        ]);
        updatedMilestoneDetails = updatedMilestoneDetails[0];
        previousMilestone.push(updatedMilestoneDetails._id);
      }

      updatedMilestoneDetails.tasks = milestone.tasks;
      return updatedMilestoneDetails;
    });

    let updatedMilstones = await Promise.all(updatedMilstonessPromises);

    const phasesToDelete = previousMilestone.filter(
      (phaseId) =>
        !updatedMilstones.some((phase) => phase._id == phaseId.toString()),
    );

    await Promise.all(
      phasesToDelete.map((milestone) =>
        this.milestoneService.deleteMilestone(milestone, body.userId),
      ),
    );

    const updateTasksPromises = updatedMilstones.map(async (milestone) => {
      const updatedTasks = await Promise.all(
        milestone.tasks.map(async (task, index) => {
          const updatedTask = {
            mainTask: task.mainTask,
            allocatedTime: this.calculateTime([{ ...milestone, tasks: [task] }]),
            milestoneId: milestone._id,
            testId: new ObjectId(testId),
            taskIndex: index,
          };

          let updatedTaskDetails;
          if (task?.['_id']) {
            updatedTaskDetails = await this.taskService.updateTask(updatedTask,task['_id']);
          } else {
            updatedTaskDetails = await this.taskService.createTask([
              {
                ...updatedTask,
              },
            ]);
            updatedTaskDetails = updatedTaskDetails[0];
          }
          updatedTaskDetails.subtasks = task.subtasks;
          return updatedTaskDetails;
        }),
      );

      milestone.tasks = updatedTasks;
      return milestone;
    });

    updatedMilstones = await Promise.all(updateTasksPromises);

    const updateSubTasksPromises = updatedMilstones.map(async (phase) => {
      for (const task of phase.tasks) {
        const updatedSubTasks = await Promise.all(
          task.subtasks.map(async (subTask, index) => {
            const updatedSubTask = {
              subTask: subTask.subTask,
              reference: subTask.reference,
              estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
              testId: testId,
              phaseId: phase._id,
              taskId: task._id,
              subTaskIndex: index,
            };

            let updatedSubTaskDetails;
            if (subTask?.['_id']) {
              updatedSubTaskDetails = await this.subTaskService.updateSubTask(
                updatedSubTask,
                subTask['_id'],
              );
            } else {
              updatedSubTaskDetails = await this.subTaskService.createSubTask([
                updatedSubTask,
              ]);
              updatedSubTaskDetails = updatedSubTaskDetails[0];
            }
            return updatedSubTaskDetails;
          }),
        );

        task.subtasks = updatedSubTasks;
      }
      return phase;
    });

    updatedMilstones = await Promise.all(updateSubTasksPromises);

    return updatedMilstones;
  }

  /** FUNCTION IMPLEMENTED TO DELETE TEST */
  async deleteTest(testId: string, userId: string) {
    return await this.testService.deleteTest(testId, userId);
  }

  /** FUNCTION IMPLEMENTED TO CREATE PLAN */
  async createPlan(plan: any, userId: string) {

    const planDetails = {
      planName: plan.planName,
      description: plan.description,
      approver: plan.approver,
    }
    const createdPlan = await this.planService.createPlan(planDetails);
    const phases = plan.phases.map((phase, index) => ({
      name: phase.name,
      allocatedTime: phase.tasks.reduce((acc, task) => acc + this.timeStringToSeconds(task.estimatedTime), 0),
      planId: createdPlan._id,
      phaseIndex: index,
    }));

    const createdPhases = await this.phaseService.createPhase(phases);
    
    const tasks = plan.phases.flatMap((phase, index) =>
      phase.tasks.map((task, taskIndex) => ({
        planType: task.planType,
        allocatedTime: this.timeStringToSeconds(task.estimatedTime),
        phaseId: createdPhases[index]._id,
        planId: createdPlan._id,
        taskIndex,
      })),
    );
    
    const createdTasks = await this.taskService.createTask(tasks);
    return { createdPlan, createdPhases, createdTasks };
  }

  /** FUNCTION IMPLEMENTED TO GET PLAN */
  async getPlans(query: any) {
    return await this.planService.getPlans(query);
  }

}
