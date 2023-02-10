
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MachineLearningSpiceComponent>) { }

  scrape() {

    this.dialogRef.close(this.url);
  }
}
