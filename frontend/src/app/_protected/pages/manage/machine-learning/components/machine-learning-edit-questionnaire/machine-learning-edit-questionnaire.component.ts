
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
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

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<MachineLearningEditQuestionnaireComponent>) {}

  name: string = '';

  nameValid() {

    return new RegExp('^[a-z0-9_-]{2,20}$').test(this.name);
  }

  save() {

    if (!this.name || !this.nameValid()) {
      this.generalService.showFeedback('You need to provide a name being 2 to 20 lower case alpha numeric characters or - and _', 'errorMessage', 'Ok', 10000);
      return;
    }

    const data: any = {
      name: this.name,
    };
    this.dialogRef.close(data);
  }
}
