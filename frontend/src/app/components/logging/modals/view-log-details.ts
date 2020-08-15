
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { LogItem } from 'src/app/models/log-item';

@Component({
  templateUrl: 'view-log-details.html',
  styleUrls: ['view-log-details.scss']
})
export class ViewLogDetails {

  constructor(
    public dialogRef: MatDialogRef<ViewLogDetails>,
    @Inject(MAT_DIALOG_DATA) public data: LogItem) {}

  close() {
    this.dialogRef.close();
  }
}
