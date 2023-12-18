
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { CodemirrorActionsService } from '../../../../../../services/codemirror-actions.service';
import { TaskService } from '../../_services/task.service';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';

/**
 * Helper component allowing you to manage and schedule tasks in the system.
 */
@Component({
  selector: 'app-manage-task',
  templateUrl: './manage-task.component.html'
})
export class ManageTaskComponent implements OnInit {

  task: Task = {
    id: '',
    description: '',
    hyperlambda: 'log.info:Hello world from task'
  };
  hlModel: HlModel;
  hlReady: boolean = false;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private taskService: TaskService,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<ManageTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    if (this.data) {
      this.task = this.data;
    }
    const res = this.codemirrorActionsService.getActions(null, 'hl');
    if (!this.data) {
      res.autofocus = false;
    }
    this.hlModel = {
      hyperlambda: this.task.hyperlambda,
      options: res,
    }
    setTimeout(() => {
      this.hlReady = true;
    }, 500);
  }

  create() {

    if (!this.validateName()) {
      this.generalService.showFeedback('Name is not valid', 'errorMessage')
      return;
    }

    if (this.data) {

      this.taskService.update(
        this.data.id,
        this.hlModel.hyperlambda,
        this.task.description).subscribe({
          next: () => {

            this.generalService.showFeedback('Task successfully edited', 'successMessage')
            this.dialogRef.close(true);
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
    } else {

      this.taskService.create(this.task.id, this.hlModel.hyperlambda, this.task.description).subscribe({
        next: () => {

          this.generalService.showFeedback('New task is created successfully', 'successMessage')
          this.dialogRef.close(true);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
      });
    }
  }

  /*
   * Private helper methods.
   */

  private validateName() {
    return this.CommonRegEx.appNames.test(this.task.id);
  }
}

interface Task {
  id: string,
  description: string,
  hyperlambda: string,
  schedules?: any
}

interface HlModel {
  hyperlambda: string,
  options: any
}
