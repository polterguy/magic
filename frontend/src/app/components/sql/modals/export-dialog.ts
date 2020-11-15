
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularCsv } from 'angular-csv-ext/dist/Angular-csv';

export interface ExportDialogData {
  result: any[];
}

@Component({
  templateUrl: 'export-dialog.html',
  styleUrls: ['export-dialog.scss'],
})
export class ExportDialogComponent implements OnInit {

  public transformed: string = '';
  public csv = '';
  public done = false;
  public type = 'JSON';

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData)
  { }
  
  ngOnInit() {
    this.transformed = JSON.stringify(this.data.result, null, 2);
    const csvCreator = new AngularCsv(this.data.result, 'CSV', {
      noDownload: true,
      useBom: false,
    });
    this.csv = csvCreator.getCsvData();
    setTimeout(() => {
      this.done = true;
    }, 250);
  }

  getCodeMirrorOptionsJson() {
    return {
      lineNumbers: true,
      theme: 'mbo',
      mode: 'application/ld+json',
      readOnly: true,
    };
  }

  getCodeMirrorOptionsCsv() {
    return {
      lineNumbers: true,
      theme: 'mbo',
      mode: 'markdown',
      readOnly: true,
    };
  }
  
  close() {
    this.dialogRef.close();
  }
}
