
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FileService } from '../services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Modal dialog allowing user to download a file directly into his backend.
 */
@Component({
  selector: 'app-download-file-dialog',
  templateUrl: './download-file-dialog.component.html',
  styleUrls: ['./download-file-dialog.component.scss']
})
export class DownloadFileDialogComponent {

  /**
   * URL of file to download.
   */
  public url: string = null;

  /**
   * Creates an instance of your component.
   */
  public constructor(
    private fileService: FileService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<DownloadFileDialogComponent>) { }

  /**
   * Invoked when user click the download button.
   */
  public download() {

    // Invoking backend to download file.
    this.fileService.downloadFileToBackend(this.data, this.url).subscribe(() => {

      // Providing feedback to user and closing dialog.
      this.feedbackService.showInfoShort('File successfully downloaded');
      this.dialogRef.close(true);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to close dialog without downloading any files.
   */
  public close() {

    // Simply closing dialog.
    this.dialogRef.close();
  }
}
