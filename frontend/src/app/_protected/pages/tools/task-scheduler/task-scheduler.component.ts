import { Component, OnInit } from '@angular/core';
import { TaskService } from './_services/task.service';
import { Task } from './_models/task.model';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Count } from 'src/app/_protected/models/common/count.model';
import { MatDialog } from '@angular/material/dialog';
import { NewTaskComponent } from './components/new-task/new-task.component';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { ScheduleTaskComponent } from './components/schedule-task/schedule-task.component';

/*
 * Helper class to encapsulate a task and its details,
 * in addition to its CodeMirror options and model.
 */
class TaskEx {

  // Actual task as returned from backend.
  task: Task;

  // CodeMirror model for editing task's details.
  model?: Model;
}

@Component({
  selector: 'app-task-scheduler',
  templateUrl: './task-scheduler.component.html',
  styleUrls: ['./task-scheduler.component.scss']
})
export class TaskSchedulerComponent implements OnInit {

  /**
   * Tasks that are currently being viewed.
   */
  public tasks: TaskEx[] = [];

  public displayedColumns: string[] = ['name', 'description', 'duration', 'created', 'actions'];

  public dataSource: any = [];

  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;

  public isLoading: boolean = true;

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getTasks();
    this.getCount();
  }

  /**
   * Retrieves tasks from your backend and re-databinds UI.
   */
  private getTasks() {
    this.taskService.list(
      '',
      this.pageIndex * this.pageSize,
      this.pageSize).subscribe({
        next: (tasks: Task[]) => {
          if (tasks) {
            tasks.forEach((item: any) => this.getDetails(item))
          }
          this.dataSource = tasks || [];
          this.isLoading = false;
        },
        error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  private getCount() {
    this.taskService.count('').subscribe({
      next: (count: Count) => this.totalItems = count.count,
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  private getDetails(item: any) {
    this.taskService.get(item.id).subscribe({
      next: (task: Task) => {
        item.hyperlambda = task.hyperlambda;
        if (task.schedules) {
          item.schedules = task.schedules.map(x => {
            return {
              id: x.id,
              due: new Date(x.due),
              repeats: x.repeats,
            };
          });
        }
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  public addTask() {
    this.dialog.open(NewTaskComponent, {
      width: '800px',
      panelClass: ['light']
    }).afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getTasks();
        this.getCount();
      }
    })
  }

  public editTask(task: any) {
    this.dialog.open(NewTaskComponent, {
      width: '800px',
      panelClass: ['light'],
      data: task
    }).afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getTasks();
        this.getCount();
      }
    })
  }

  /**
   * Invoked when user wants to execute a task.
   *
   * @param task Task caller wants to save
   */
  public execute(task: any) {
    this.taskService.execute(task.id).subscribe({
      next: () => this.generalService.showFeedback('Task successfully executed', 'successMessage'),
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage', 'Ok', 4000)});
  }

  /**
   * Deletes a task in your backend.
   *
   * @param task Task to delete
   */
  public deleteTask(task: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${task.id} task`,
        description_extra: `You are deleting the selected task. Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.taskService.delete(task.id).subscribe({
          next: () => {
            this.generalService.showFeedback('Task successfully deleted', 'successMessage');
            this.getTasks();
            this.getCount();
          },
          error: (error: any)=> this.generalService.showFeedback(error.error.message??error, 'errorMessage', 'Ok', 4000)});
      }
    });
  }

  /**
   * Schedules task for execution in the future.
   *
   * @param task Task user wants to schedule
   */
  public schedule(task: any) {
    this.dialog.open(ScheduleTaskComponent, {
      width: '800px',
      data: task,
      autoFocus: false
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.getTasks();
      }
    });
  }

  public filterList(event: string) {
    if (event !== '') {
      // this.dataSource = this.originalDataSource.filter((item: any) => item.name.indexOf(event) > -1);
    } else {
      // this.dataSource = this.originalDataSource;
    }
  }
}
