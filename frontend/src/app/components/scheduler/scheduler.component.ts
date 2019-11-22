
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
    this.schedulerService.listTasks().subscribe(res => {
      console.log(res);
      this.tasks = res;
    });
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
