
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper component to "spice up" model with content from one single web page.
 */
@Component({
  selector: 'app-machine-learning-spice',
  templateUrl: './machine-learning-spice.component.html',
  styleUrls: ['./machine-learning-spice.component.scss']
})
export class MachineLearningSpiceComponent {

  url: string;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;
  lists?: boolean = true;
  images?: boolean = true;
  code?: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MachineLearningSpiceComponent>) { }

  scrape() {

    this.dialogRef.close({
      url: this.url,
      lists: this.lists,
      images: this.images,
      code: this.code,
    });
  }
}
