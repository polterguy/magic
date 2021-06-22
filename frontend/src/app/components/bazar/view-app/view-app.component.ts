
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AppManifest } from '../../config/models/app-manifest.model';
import { ConfigService } from '../../config/services/config.service';


/**
 * Helper class to encapsulate a single Bazar app.
 */
export class BazarDialogResult {

  /**
   * Manifest for app we should install.
   */
  public manifest: AppManifest;

  /**
   * If false then app cannot be installed.
   */
  public canInstall: boolean;
}

/**
 * Modal dialog for viewing details about Bazar app.
 */
@Component({
  selector: 'app-view-app',
  templateUrl: './view-app.component.html',
  styleUrls: ['./view-app.component.scss']
})
export class ViewAppComponent implements OnInit {

  /**
   * README file's content for module.
   */
  public readme: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to retrieve README file's content
   * @param feedbackService Needed to display errors and such
   * @param data Object encapsulating which module to install, and its meta data
   * @param dialogRef Needed to explicitly close dialog from TypeScript
   */
  constructor(
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: BazarDialogResult,
    private dialogRef: MatDialogRef<ViewAppComponent>,) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving component's README file.
    this.configService.getReadMeFile(this.data.manifest).subscribe((result: Response) => {

      // Assigning model.
      this.readme = result.result;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to install app.
   */
  public install() {

    // Closing dialog passing in data to caller.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user does NOT want to install app.
   */
   public close() {

    // Closing dialog passing in NO data to caller.
    this.dialogRef.close();
  }
}
