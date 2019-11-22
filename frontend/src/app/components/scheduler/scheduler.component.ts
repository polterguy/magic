
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SchedulerService } from 'src/app/services/scheduler-service';
import { TaskModel } from 'src/app/models/task-model';
import { DateFromPipe } from 'src/app/pipes/date-from-pipe';

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
      console.log(res);
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
