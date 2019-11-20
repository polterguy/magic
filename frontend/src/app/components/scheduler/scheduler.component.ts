
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SchedulerService } from 'src/app/services/scheduler-service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  constructor(
    private snackBar: MatSnackBar,
    private schedulerService: SchedulerService) {
    }

  ngOnInit(): void {
    this.schedulerService.listTasks().subscribe(res => {
      console.log(res);
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
      duration: 5000,
    });
  }
}
