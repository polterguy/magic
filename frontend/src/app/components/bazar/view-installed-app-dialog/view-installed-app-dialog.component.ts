
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { AppManifest } from '../models/app-manifest';
import { FileService } from '../../files/services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';

@Component({
  selector: 'app-view-installed-app-dialog',
  templateUrl: './view-installed-app-dialog.component.html',
  styleUrls: ['./view-installed-app-dialog.component.scss']
})
export class ViewInstalledAppDialogComponent implements OnInit {

  /**
   * Markdown fetched from app's README.md file.
   */
  public markdown: string;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to manually close dialog from code
   * @param feedbackService Needed to display feedback to user.
   * @param data App's manifest or meta data
   * @param dialogRef Needed to manually close dialog from code
   */
  constructor(
    private fileService: FileService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: AppManifest,
    private dialogRef: MatDialogRef<ViewInstalledAppDialogComponent>) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving app's README.md file, if it exists.
    this.fileService.listFiles(
      '/modules/' + this.data.module_name + '/',
      'README.md').subscribe((result: string[]) => {

      // Checking if invocation returned more than zero entries.
      if (result && result.length > 0) {

        // App has a README file, loading it, and making sure we display it.
        this.fileService.loadFile(
          '/modules/' + this.data.module_name +
          '/README.md').subscribe((markdown: string) => {

            // Assigning model.
            this.markdown = markdown;

          }, (error: any) => this.feedbackService.showError(error));
      }
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to close dialog.
   */
  public close() {

    // Simply closing dialog without passing in data to caller.
    this.dialogRef.close();
  }
}
