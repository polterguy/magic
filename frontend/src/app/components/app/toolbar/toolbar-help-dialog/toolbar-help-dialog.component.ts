
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Modal dialog component for displaying context sensitive help videos,
 * guiding user through usage of the system.
 */
@Component({
  selector: 'app-toolbar-help-dialog',
  templateUrl: './toolbar-help-dialog.component.html',
  styleUrls: ['./toolbar-help-dialog.component.scss']
})
export class ToolbarHelpDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param sanitizer Needed to bypass security trudt for YouTube videos
   * @param data YouTube video to show
   * @param dialogRef Needed to close dialog
   */
  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ToolbarHelpDialogComponent>) { }

  /**
   * Invoked when user wants to close dialog.
   */
  public close() {

    // Closing dialog, no data.
    this.dialogRef.close();
  }

  /**
   * Invoked when URL for YouTube video is requested.
   */
  public getVideoUrl() {

    // Returning URL as bypassing security trust level.
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.data.video);
  }
}
