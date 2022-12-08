import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { GeneralService } from 'src/app/_general/services/general.service';
import { TaskService } from '../../_services/task.service';

@Component({
  selector: 'app-schedule-task',
  templateUrl: './schedule-task.component.html',
  styleUrls: ['./schedule-task.component.scss']
})
export class ScheduleTaskComponent implements OnInit {

  public minDate: Date;

  public fixedDateTime: string;

  public scheduleOption: string; // fixed || repeat || custom

  public period: string[] = [
    'seconds', 'minutes', 'hours', 'days', 'weeks', 'months'
  ]
  public numbers: number[] = [
    5, 10, 15, 20, 25, 30
  ]

  public selectedPeriod: string;
  public selectedNumber: number;
  public customRepetition: string;

  constructor(
    private taskService: TaskService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ScheduleTaskComponent>) { }

  ngOnInit(): void {
    this.minDate = new Date();
    this.scheduleOption = 'fixed';
  }

  public save() {

    let repeating: string = null;
    let date: Date = null;

    if (this.scheduleOption === 'fixed') {
      if (!this.fixedDateTime || this.fixedDateTime === undefined) {
        this.generalService.showFeedback('Please complete the setting', 'errorMessage');
        return;
      }
      date = new Date(this.fixedDateTime);
      repeating = null;
    } else if (this.scheduleOption === 'repeat') {
      if (!this.selectedNumber || !this.selectedPeriod) {
        this.generalService.showFeedback('Please complete the setting', 'errorMessage');
        return;
      }
      repeating = `${this.selectedNumber}.${this.selectedPeriod}`;
      date = null;
    } else {
      if (!this.customRepetition || this.customRepetition === '') {
        this.generalService.showFeedback('Please complete the setting', 'errorMessage');
        return;
      }
      repeating = this.customRepetition;
      date = null;
    }

    this.taskService.schedule(this.data.id, date, repeating).subscribe({
      next: () => {
        this.generalService.showFeedback('Task was successfully scheduled', 'successMessage');
        this.dialogRef.close(true);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 4000)});
  }
}
