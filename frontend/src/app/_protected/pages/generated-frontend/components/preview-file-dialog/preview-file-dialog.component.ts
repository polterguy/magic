
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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

  /**
   * Creates an instance of your component.
   * 
   * @param data File's content
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
