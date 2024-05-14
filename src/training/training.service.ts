import { Injectable } from '@nestjs/common';
import { link } from 'fs';
import { ObjectId } from 'mongodb';
import {
  CourseDto,
  CreateCourseDto,
  UpdateApproversDto,
  UpdateCourseDto,
  UpdatePhaseDto,
} from 'src/common/dtos/create-course.dto';
import { CourseService } from 'src/course/course.service';
import { PhaseService } from 'src/phase/phase.service';
import { SubTaskService } from 'src/sub-task/sub-task.service';
import { TaskService } from 'src/task/task.service';

@Injectable()
export class TrainingService {
  constructor(
    private courseService: CourseService,
    private phaseService: PhaseService,
    private taskService: TaskService,
    private subTaskService: SubTaskService,
  ) {}

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

    const createdTasks = await this.taskService.createTask(tasks);

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
    };

    await this.courseService.updateCourse(updatedCourseDetails, courseId);

    /** DONE TO FETCH PREVIOUS PHASE  */
    const previousPhases = (
      await this.phaseService.getPhases({ courseId })
    ).map((phase) => phase._id);

    const updatedPhases: Array<any> = [];

    for (const phase of body.phases) {
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
      }

      updatedPhaseDetails.tasks = phase.tasks;
      updatedPhases.push(updatedPhaseDetails);
    }

    /*** deleting all the phases which are not in use now */
    for (const phase of updatedPhases) {
      if (!previousPhases.includes(phase._id)) {
        await this.phaseService.deletePhase(phase, body.userId);
      }
    }

    /** UPDATING TASKS */
    for (const phase of updatedPhases) {
      const previousTasks = (await this.taskService.getTasks(phase._id)).map(
        (task) => task._id,
      );

      for (const [index, task] of phase.tasks.entries()) {
        const updatedTask = {
          mainTask: task.mainTask,
          allocatedTime: this.calculateTime([{ ...phase, tasks: [task] }]),
          phaseId: phase._id,
          courseId: new ObjectId(courseId),
          taskIndex: phase.tasks.indexOf(task),
        };

        let updatedTaskDetails;
        if (task?.['_id']) {
          updatedTaskDetails = await this.taskService.updateTask(
            updatedTask,
            task['_id'],
          );
        } else {
          updatedTaskDetails = await this.taskService.createTask([updatedTask]);
          updatedTaskDetails = updatedTaskDetails[0];
        }
        phase.tasks[index] = updatedTaskDetails;
        phase.tasks[index].subtasks = task.subtasks;
      }

      /*** deleting all the tasks which are not in use now */
      for (const task of previousTasks) {
        if (!previousTasks.includes(task._id)) {
          await this.taskService.deleteTask(task._id, body.userId);
        }
      }
    }

    /** Updating subtasks */
    for (const phase of updatedPhases) {
      for (const task of phase.tasks) {
        const previousSubTasks = (
          await this.subTaskService.getSubTasks(task._id)
        ).map((subTask) => subTask._id);

        for (const [index, subTask] of task.subtasks.entries()) {
          const updatedSubTask = {
            subTask: subTask.subTask,
            link: subTask.link,
            estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
            courseId: courseId,
            phaseId: phase._id,
            taskId: task._id,
            subTaskIndex: task.subtasks.indexOf(subTask),
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
          task.subtasks[index] = updatedSubTaskDetails;
        }

        /*** deleting all the subtasks which are not in use now */
        for (const subTask of previousSubTasks) {
          if (!previousSubTasks.includes(subTask._id)) {
            console.log('subTask', subTask);
            // await this.subTaskService.deleteSubTask(subTask._id, body.userId);
          }
        }
      }
    }

    return updatedPhases;
  }
}
