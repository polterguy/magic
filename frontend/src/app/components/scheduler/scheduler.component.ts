
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void { }

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
