
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSelectChange, MatSnackBar } from '@angular/material';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { TaskModel } from 'src/app/models/task-model';
import { SchedulerService } from 'src/app/services/scheduler-service';

export interface NewTaskDialogData {
  filename: string;
}

@Component({
  selector: 'new-task-dialog',
  templateUrl: 'new-task-dialog.html',
})
export class NewTaskDialogComponent implements OnInit {

  private taskDate: string = null;
  private taskValue: string = null;
  private taskName: string = null;
  private taskDescription: string = null;
  private taskTime: string = null;
  private weekday: string = null;
  private taskHyperlambda: string;
  private repetitionPattern: string = null;
  private minDate: Date = new Date();

  constructor(
    private evaluatorService: EvaluatorService,
    private schedulerService: SchedulerService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<NewTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewTaskDialogData) {
  }

  ngOnInit(): void {
    this.evaluatorService.vocabulary().subscribe(res => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
      }
    };
  }

  repetitionChanged(e: MatSelectChange) {
    this.repetitionPattern = e.value;
  }

  shouldDisplayValue() {
    switch(this.repetitionPattern) {
      case 'seconds':
      case 'minutes':
      case 'hours':
      case 'days':
      case 'day-of-month':
        return true;
      default:
        return false;
    }
  }

  shouldDisplayDatePicker() {
    if (this.repetitionPattern === 'future-date') {
      return true;
    }
    return false;
  }

  shouldDisplayTime() {
    switch(this.repetitionPattern) {
      case 'future-date':
      case 'day-of-month':
      case 'last-day-of-month':
      case 'weekday':
        return true;
      default:
        return false;
    }
  }

  shouldDisplayWeekdays() {
    if (this.repetitionPattern === 'weekday') {
      return true;
    }
    return false;
  }

  getValueName() {
    if (this.repetitionPattern === 'day-of-month') {
      return 'Day of month';
    }
    return this.repetitionPattern.charAt(0).toUpperCase() + 
      this.repetitionPattern.slice(1);
  }

  close(): void {
    this.dialogRef.close();
  }

  saveTask(): void {
    if (this.taskName === '' || this.taskName === null) {
      this.showError('You have to provide a name for your task');
      return;
    }
    if (this.repetitionPattern == null) {
      this.showError('You have to provide a repetition pattern for your task');
      return;
    }
    if (this.repetitionPattern === 'weekday') {
      if (this.weekday === null) {
        this.showError('You have to provide a weekday for your task repetition pattern');
        return;
      }
    }
    if (this.repetitionPattern === 'day-of-month' && 
      (this.taskValue === '' || this.taskValue === null)) {
      this.showError('You have to provide a day of month for your task repetition pattern');
      return;
    }
    if (this.repetitionPattern === 'future-date') {
      if (this.taskDate === '' || this.taskDate === null) {
        this.showError('You have to provide a date for your task');
        return;
      }
    }
    switch (this.repetitionPattern) {
      case 'seconds':
      case 'minutes':
      case 'hours':
      case 'days':
        if (this.taskValue === null || this.taskValue === '') {
          this.showError('You have to provide a value for your task repetition pattern');
          return;
        }
        break;
      case 'weekday':
      case 'last-day-of-month':
      case 'day-of-month':
      case 'future-date':
        if (this.taskTime === null || this.taskTime === '') {
          this.showError('You have to provide a time of day for your task repetition pattern');
          return;
        }
        break;
    }
    if (this.taskHyperlambda === null || this.taskHyperlambda === undefined || this.taskHyperlambda.length === 0) {
      this.showError('You have to provide some Hyperlambda for your task');
      return;
    }

    /*
     * If we come this far, no validation errors exists.
     */
    const task = new TaskModel();
    task.name = this.taskName;
    if (this.taskDescription !== null && this.taskDescription !== undefined) {
      task.description = this.taskDescription;
    }
    task.hyperlambda = this.taskHyperlambda;

    /*
     * Creating our repetition pattern for then to create our task.
     */
    if (this.repetitionPattern === 'future-date') {

      /*
       * [when] type of task.
       */
      const date = new Date(this.taskDate);
      const hours = this.getHours();
      if (hours === null) {
        return; // Error
      }
      date.setHours(hours);
      const minutes = this.getMinutes();
      if (minutes === null) {
        return; // Error
      }
      date.setMinutes(minutes);
      task.due = date;
      this.schedulerService.createTask(task).subscribe(res => {
        console.log(res);
        this.dialogRef.close();
      }, error => {
        this.showError(error.error.message);
      });
    }

    /*
     * [repeat] type of task.
     */
    switch (this.repetitionPattern) {
      case 'seconds':
      case 'minutes':
      case 'hours':
      case 'days':
        const value = this.getValue();
        if (value === null) {
          return; // Error
        }
        task.repeat = {
          interval: this.repetitionPattern,
          value,
        };
        this.schedulerService.createTask(task).subscribe(res => {
          console.log(res);
          this.dialogRef.close();
        }, error => {
          this.showError(error.error.message);
        });
        break;
      case 'weekday':
        const time = this.getTime();
        if (time === null) {
          return; // Error
        }
        task.repeat = {
          interval: this.weekday,
          time,
        };
        this.schedulerService.createTask(task).subscribe(res => {
          console.log(res);
          this.dialogRef.close();
        }, error => {
          this.showError(error.error.message);
        });
        break;
      case 'last-day-of-month':
        const time2 = this.getTime();
        if (time2 === null) {
          return; // Error
        }
        task.repeat = {
          interval: 'last-day-of-month',
          time: time2,
        };
        this.schedulerService.createTask(task).subscribe(res => {
          console.log(res);
          this.dialogRef.close();
        }, error => {
          this.showError(error.error.message);
        });
        break;
      case 'day-of-month':
        const time3 = this.getTime();
        if (time3 === null) {
          return; // Error
        }
        const value2 = this.getValue();
        if (value2 === null) {
          return null; // Error
        }
        task.repeat = {
          interval: value2.toString(),
          time: time3,
        };
        this.schedulerService.createTask(task).subscribe(res => {
          console.log(res);
          this.dialogRef.close();
        }, error => {
          this.showError(error.error.message);
        });
        break;
    }
  }

  getTime(): string {
    const result = this.taskTime;
    if (result.length !== 5 || result.indexOf(':') !== 2) {
      return null;
    }
    return result;
  }

  getValue(): number {
    const value = Number(this.taskValue);
    if (isNaN(value)) {
      return null;
    }
    return value;
  }

  getHours(): number {
    const hours = Number(this.taskTime.split(':')[0]);
    if (isNaN(hours) || hours < 1 || hours > 23) {
      this.showError('Your time needs to be hours and minutes separated by colon (:), e.g. \'23:59\'.');
      return null;
    }
    return hours;
  }

  getMinutes(): number {
    const minutes = Number(this.taskTime.split(':')[1]);
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      this.showError('Your time needs to be hours and minutes separated by colon (:), e.g. \'23:59\'.');
      return null;
    }
    return minutes;
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
