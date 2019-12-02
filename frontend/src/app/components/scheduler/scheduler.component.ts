
import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog, MatSlideToggleChange } from '@angular/material';
import { SchedulerService } from 'src/app/services/scheduler-service';
import { TaskModel } from 'src/app/models/task-model';
import { NewTaskDialogComponent } from './modals/new-task-dialog';
import { EvaluatorService } from 'src/app/services/evaluator-service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  private schedulerState: string;
  private isRunning: boolean;
  private displayedColumns = ['name', 'description', 'due'];
  private tasks: any[];
  private selectedTaskName: string = null;
  private selectedTask: TaskModel = null;
  private filter: string = null;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private evaluatorService: EvaluatorService,
    private schedulerService: SchedulerService) {
  }

  ngOnInit(): void {
    this.getTasks();
    this.schedulerService.isRunning().subscribe(res => {
      this.isRunning = res['is-running'];
      if (this.isRunning) {
        this.schedulerState = 'Stop scheduler';
      } else {
        this.schedulerState = 'Start scheduler';
      }
    });
  }

  isRunningChanged(e: MatSlideToggleChange) {
    if (e.checked) {
      this.schedulerService.turnOn().subscribe(res => {
        this.schedulerState = 'Stop scheduler';
      });
    } else {
      this.schedulerService.turnOff().subscribe(res => {
        this.schedulerState = 'Start scheduler';
      });
    }
  }

  getTasks() {
    this.schedulerService.listTasks().subscribe(res => {
      this.selectedTask = null;
      this.selectedTaskName = null;
      this.tasks = res;
    });
  }

  createNewTask() {
    const dialogRef = this.dialog.open(NewTaskDialogComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        path: '',
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      this.getTasks();
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      readOnly: true,
    };
  }

  getFilteredTasks() {
    if (this.filter === null || this.filter === '') {
      return this.tasks;
    }
    return this.tasks.filter(x => x.name.toLowerCase().indexOf(this.filter.toLowerCase()) > -1 ||
      (x.description !== null && x.description !== undefined && x.description.toLowerCase().indexOf(this.filter.toLowerCase()) > -1));
  }

  selectTask(name: string) {
    this.selectedTaskName = name;
    this.schedulerService.getTask(name).subscribe(res => {
      this.selectedTask = res;
    });
  }

  getInterval(interval: string) {
    if (interval === 'last-day-of-month') {
      return 'last day of the month';
    }
    if (!isNaN(Number(interval))) {
      switch (Number(interval)) {
        case 1:
          return '1st of every month';
        case 2:
          return '2nd of every month';
        case 3:
          return '3rd of every month';
        default:
            return interval + 'th of each month';
      }
    }
    return interval;
  }

  getDate(due: string) {
    return new Date(due).toLocaleString();
  }

  runTask() {
    this.evaluatorService.evaluate(this.selectedTask.hyperlambda).subscribe(res => {
      this.showHttpSuccess('Task was evaluated sucecssfully');
    });
  }

  deleteActiveTask() {
    this.schedulerService.deleteTask(this.selectedTask.name).subscribe(res => {
      this.showHttpSuccess('Task was successfully deleted');
      this.getTasks();
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
