
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../../../../../../../_general/services/sql.service';

/**
 * Modal helper dialog to load SQL snippets from the backend.
 */
@Component({
  selector: 'app-load-sql-snippet-dialog',
  templateUrl: './load-sql-snippet-dialog.component.html'
})
export class SqlSnippetDialogComponent implements OnInit {

  files: string[] = [];
  filter: string = null;

  constructor(
    private dialogRef: MatDialogRef<SqlSnippetDialogComponent>,
    private generalService: GeneralService,
    private sqlService: SqlService,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {

    this.sqlService.listSnippets(this.data).subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.sql'));
    }, (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage'));
  }

  filterList(event: { searchKey: string }) {

    this.filter = event.searchKey;
  }

  getFilename(path: string) {

    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  select(filename: string) {

    this.dialogRef.close(this.getFilename(filename));
  }
}
