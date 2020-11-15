
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExportDialogData {
  result: string;
}

@Component({
  templateUrl: 'export-dialog.html',
  styleUrls: ['export-dialog.scss'],
})
export class ExportDialogComponent implements OnInit {

  public transformed: string = '';
  public done = false;

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData)
  { }
  
  ngOnInit() {
    this.transformed = JSON.stringify(this.data.result, null, 2);
    setTimeout(() => {
      this.done = true;
    }, 250);
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'mbo',
      mode: 'application/ld+json',
      readOnly: true,
    };
  }
}
