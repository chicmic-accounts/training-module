import { Injectable } from '@nestjs/common';
import { CourseDto, CreateCourseDto } from 'src/common/dtos/create-course.dto';
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

  /** FUNCTION IMPLEMENTED TO CREATE A COURSE */
  async createCourse(courseDetails: CreateCourseDto, userId: string) {
    /** EXTRACTION OF COURSE DETAILS */

    const course: CourseDto = {
      courseName: courseDetails.courseName,
      approver: courseDetails.approver,
      figmaLink: courseDetails.figmaLink,
      guidelines: courseDetails.guidelines,
      createdBy: userId,
      totalPhases: courseDetails.phases.length,
      noOfTopics: courseDetails.phases.reduce((acc, phase) => {
        return (
          acc +
          phase.tasks.reduce((acc, task) => {
            return acc + task.subtasks.length;
          }, 0)
        );
      }, 0),
      estimatedTime: courseDetails.phases.reduce((acc, phase) => {
        return (
          acc +
          phase.tasks.reduce((acc, task) => {
            return (
              acc +
              task.subtasks.reduce((acc, subTask) => {
                return acc + this.timeStringToSeconds(subTask.estimatedTime);
              }, 0)
            );
          }, 0)
        );
      }, 0),
    };

    const createdCourse = await this.courseService.createCourse(course);

    /** EXTRACTION OF PHASE*/
    const phases = courseDetails.phases.map((phase, index) => {
      const allocatedTime: number = phase.tasks.reduce((acc, task) => {
        return (
          acc +
          task.subtasks.reduce((acc, subTask) => {
            return acc + this.timeStringToSeconds(subTask.estimatedTime);
          }, 0)
        );
      }, 0);
      return {
        name: phase.name,
        allocatedTime,
        courseId: createdCourse._id,
        phaseIndex: index,
      };
    });

    const createdPhases =
      await this.phaseService.createPhase(phases); /** CREATION OF PHASES */

    /**EXTRACTION OF TASKS */
    const tasks = courseDetails.phases.flatMap((phase, index) => {
      return phase.tasks.flatMap((task, taskIndex) => {
        const allocatedTime = task.subtasks.reduce((acc, subTask) => {
          return acc + this.timeStringToSeconds(subTask.estimatedTime);
        }, 0);
        return {
          mainTask: task.mainTask,
          allocatedTime,
          phaseId: createdPhases[index]._id,
          courseId: createdCourse._id,
          taskIndex,
        };
      });
    });

    const createdTasks =
      await this.taskService.createTask(tasks); /**CREATION OF TASKS */

    /**EXTRACTION OF SUBTASKS */
    const subTasks = courseDetails.phases.flatMap((phase, index) => {
      return phase.tasks.flatMap((task, taskIndex) => {
        return task.subtasks.map((subTask, subTaskIndex) => {
          return {
            ...subTask,
            estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
            courseId: createdCourse._id,
            phaseId: createdPhases[index]._id,
            taskId: createdTasks[taskIndex]._id,
            subTaskIndex,
          };
        });
      });
    });

    /**CREATION OF SUBTASKS */
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
  async getAllCourses() {
    return await this.courseService.getAllCourses();
  }
}
