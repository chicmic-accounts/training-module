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
    const calculateTime = (phases) =>
      phases.reduce(
        (acc, phase) =>
          acc +
          phase.tasks.reduce(
            (acc, task) =>
              acc +
              task.subtasks.reduce(
                (acc, subTask) =>
                  acc + this.timeStringToSeconds(subTask.estimatedTime),
                0,
              ),
            0,
          ),
        0,
      );

    const course: CourseDto = {
      ...courseDetails,
      createdBy: userId,
      totalPhases: courseDetails.phases.length,
      noOfTopics: calculateTime(courseDetails.phases),
      estimatedTime: calculateTime(courseDetails.phases),
    };

    const createdCourse = await this.courseService.createCourse(course);

    const phases = courseDetails.phases.map((phase, index) => {
      const allocatedTime = calculateTime([phase]);
      return {
        name: phase.name,
        allocatedTime,
        courseId: createdCourse._id,
        phaseIndex: index,
      };
    });

    const createdPhases = await this.phaseService.createPhase(phases);

    const tasks = courseDetails.phases.flatMap((phase, index) =>
      phase.tasks.map((task, taskIndex) => {
        const allocatedTime = calculateTime([{ ...phase, tasks: [task] }]);
        return {
          mainTask: task.mainTask,
          allocatedTime,
          phaseId: createdPhases[index]._id,
          courseId: createdCourse._id,
          taskIndex,
        };
      }),
    );

    const createdTasks = await this.taskService.createTask(tasks);

    const subTasks = courseDetails.phases.flatMap((phase, index) =>
      phase.tasks.flatMap((task, taskIndex) =>
        task.subtasks.map((subTask, subTaskIndex) => ({
          ...subTask,
          estimatedTime: this.timeStringToSeconds(subTask.estimatedTime),
          courseId: createdCourse._id,
          phaseId: createdPhases[index]._id,
          taskId: createdTasks[taskIndex]._id,
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
  async getAllCourses() {
    return await this.courseService.getAllCourses();
  }
}
