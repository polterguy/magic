
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { EvaluatorService } from '../../services/evaluator.service';

// Application specific imports.
import { GeneralService } from '../../services/general.service';

/**
 * Load snippet dialog for loading saved Hyperlambda snippets from the backend.
 */
@Component({
  selector: 'app-load-snippet-dialog',
  templateUrl: './load-snippet-dialog.component.html',
  styleUrls: ['./load-snippet-dialog.component.scss']
})
export class LoadSnippetDialogComponent implements OnInit {

  files: string[] = [];
  filter: string = null;

  constructor(
    private dialogRef: MatDialogRef<LoadSnippetDialogComponent>,
    private evaluatorService: EvaluatorService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.evaluatorService.snippets().subscribe({
      next: (files: string[]) => {
        this.files = files.filter(x => x.endsWith('.hl'));
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  filterList(event: { searchKey: string }) {

    this.filter = event.searchKey;
  }

  getFiles() {

    if (!this.filter) {
      return this.files;
    } else {
      return this.files.filter(x => this.getFilename(x).indexOf(this.filter) !== -1);
    }
  }

  getFilename(path: string) {

    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  select(filename: string) {

    this.dialogRef.close(this.getFilename(filename));
  }
}
