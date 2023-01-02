
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { TaskService } from '../../_services/task.service';

/**
 * Helper component for scheduling tasks in the system.
 */
@Component({
  selector: 'app-schedule-task',
  templateUrl: './schedule-task.component.html'
})
export class ScheduleTaskComponent implements OnInit {

  minDate: Date;
  fixedDateTime: string;
  scheduleOption: string; // fixed || repeat || custom
  period: string[] = [
    'seconds', 'minutes', 'hours', 'days', 'weeks', 'months'
  ];
  numbers: number[] = [
    5, 10, 15, 20, 25, 30
  ];
  selectedPeriod: string;
  selectedNumber: number;
  customRepetition: string;

  constructor(
    private taskService: TaskService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ScheduleTaskComponent>) { }

  ngOnInit() {
    this.minDate = new Date();
    this.scheduleOption = 'fixed';
  }

  save() {

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
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
    });
  }
}
