
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

  public json = '';
  public csv = '';
  public sql = '';
  public done = false;
  public type = 'JSON';
  public sqlTableName = 'xxx';

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData)
  { }
  
  ngOnInit() {

    // Making sure we don't display CodeMirror editor before dialog has faded into view.
    setTimeout(() => {
      this.parseResult();
      this.done = true;
    }, 250);
  }

  public parseResult() {

    switch(this.type) {

      case 'JSON':
        // Creating JSON result.
        this.json = JSON.stringify(this.data.result, null, 2);
        break;

      case 'CSV':
        // Creating CSV result every time, since settings might have changed.
        const csvCreator = new AngularCsv(this.data.result, 'CSV', {
          noDownload: true,
          useBom: false,
        });
        this.csv = csvCreator.getCsvData();
        break;

      case 'SQL':
        // Creating SQL result every time, since settings might have changed.
        let allSql = '';
        for(var idx = 0; idx < this.data.result.length; idx++) {
          let curSql = `insert into ${this.sqlTableName} (`;
          let idxNo = 0;
          for (var idxProp in this.data.result[0]) {
            if (idxNo++ > 0) {
              curSql += ', ';
            }
            curSql += idxProp;
          }
          curSql += ') values (';
          idxNo = 0;
          for (var idxProp in this.data.result[idx]) {
            if (idxNo++ > 0) {
              curSql += ', ';
            }
            const val = this.data.result[idx][idxProp];
            if (!val) {
              curSql += 'null';
            } else {
              switch (typeof val) {

                case 'number':
                  curSql += val;
                  break;

                case 'boolean':
                  curSql += val;
                  break;

                default:
                  curSql += '"';
                  curSql += val.toString()
                    .replaceAll('"', '""')
                    .replaceAll('\n', '\\n')
                    .replaceAll('\r', '\\r');
                  curSql += '"';
                  break;
              }
            }
          }
          curSql += ');\r\n';
          allSql += curSql;
        }
        this.sql = allSql;
        break;
    }
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

  getCodeMirrorOptionsSql() {
    return {
      lineNumbers: true,
      theme: 'mbo',
      mode: 'text/x-mysql',
      readOnly: true,
    };
  }
  
  close() {
    this.dialogRef.close();
  }
}
