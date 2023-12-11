
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Edit/create new questionnaire modal dialog.
 */
@Component({
  selector: 'app-machine-learning-edit-questionnaire',
  templateUrl: './machine-learning-edit-questionnaire.component.html',
  styleUrls: ['./machine-learning-edit-questionnaire.component.scss']
})
export class MachineLearningEditQuestionnaireComponent {

  name: string = '';
  type: string = 'single-shot';
  action: string = 'sendgrid-subscribe';
  types: string[] = [
    'single-shot'
  ];

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MachineLearningEditQuestionnaireComponent>) {

    if (this.data) {
      this.name = this.data.name;
      this.type = this.data.type;
      this.action = this.data.action;
    }
  }

  nameValid() {

    return new RegExp('^[a-z0-9_-]{2,20}$').test(this.name);
  }

  typeValid() {

    return new RegExp('^[a-z0-9_-]{2,20}$').test(this.name);
  }

  save() {

    if (!this.nameValid() || !this.typeValid()) {
      this.generalService.showFeedback('You need to provide a name and a type being 2 to 20 lower case alpha numeric characters or - and _', 'errorMessage', 'Ok', 10000);
      return;
    }

    const data: any = {
      name: this.name,
      type: this.type,
      action: this.action,
    };
    if (this.data) {
      data.id = this.data.id;
    }
    this.dialogRef.close(data);
  }
}
