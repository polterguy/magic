/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Modal dialog allowing user to select which items to display in his "overview" component.
 */
@Component({
  selector: 'app-overview-dialog',
  templateUrl: './overview-dialog.component.html'
})
export class OverviewDialogComponent {

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<OverviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentList: any, fullList: any, titles: string[] }) { }

  save() {

    if (!this.data.titles || this.data.titles.length < 1) {
      this.generalService.showFeedback('Please select minimum 3 items', 'errorMessage', null, 3000);
      return;
    }
    localStorage.setItem('overviewItems', JSON.stringify(this.data.titles));
    this.dialogRef.close(this.data.titles);
  }

  cancel() {

    this.dialogRef.close();
  }
}
