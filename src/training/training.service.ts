import { HttpException, Injectable } from '@nestjs/common';
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
      noOfTopics: totalTime,
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
}
