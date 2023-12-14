
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Component for previewing a file that supports previewing, such as Markdown files, etc.
 */
@Component({
  selector: 'app-preview-file-dialog',
  templateUrl: './preview-file-dialog.component.html',
  styleUrls: ['./preview-file-dialog.component.scss']
})
export class PreviewFileDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
