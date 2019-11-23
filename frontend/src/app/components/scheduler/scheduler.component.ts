
import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';
import { SchedulerService } from 'src/app/services/scheduler-service';
import { TaskModel } from 'src/app/models/task-model';
import { NewTaskDialogComponent } from './modals/new-task-dialog';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  private displayedColumns = ['name'];
  private tasks: string[];
  private selectedTaskName: string = null;
  private selectedTask: TaskModel = null;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private schedulerService: SchedulerService) {
  }

  ngOnInit(): void {
    this.getTasks();
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
      if (res !== undefined) {
        alert('success');
      }
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
    return this.tasks;
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
