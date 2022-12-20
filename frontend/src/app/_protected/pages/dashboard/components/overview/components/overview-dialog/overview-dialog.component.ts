/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Modal dialog allowing user to select which items to display in his "overview" component.
 */
@Component({
  selector: 'app-overview-dialog',
  templateUrl: './overview-dialog.component.html'
})
export class OverviewDialogComponent implements OnInit {

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<OverviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentList: any, fullList: any, titles: string[] }) { }

  ngOnInit(): void {
  }

  public save() {
    if (!this.data.titles || this.data.titles.length < 3) {
      this.generalService.showFeedback('Please select minimum 3 items', 'errorMessage', null, 3000);
      return;
    }
    localStorage.setItem('overviewItems', JSON.stringify(this.data.titles));
    this.dialogRef.close(this.data.titles);
  }

  public cancel() {
    this.dialogRef.close(null);
  }
}
