
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../../../../../_general/services/sql.service';

/**
 * Modal helper dialog to load SQL snippets from the backend.
 */
@Component({
  selector: 'app-load-sql-snippet-dialog',
  templateUrl: './load-sql-snippet-dialog.component.html'
})
export class SqlSnippetDialogComponent implements OnInit {

  /**
   * Snippet files as returned from backend.
   */
  files: string[] = [];

  /**
   * Filter for filtering files to display.
   */
  filter: string = '';

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

  /**
   * Returns only the filename parts from the given full path and filename.
   */
  getFilename(path: string) {
    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  /**
   * Invoked when user selects a file.
   */
  select(filename: string) {
    this.dialogRef.close(this.getFilename(filename));
  }
}
