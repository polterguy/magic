
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
 * Displays details about one app as published by the current server.
 */
@Component({
  selector: 'app-view-published',
  templateUrl: './view-published.component.html',
  styleUrls: ['./view-published.component.scss']
})
export class ViewPublishedComponent implements OnInit {

  /**
   * README file for module.
   */
  public readme: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to explicitly close dialog from TypeScript
   * @param data Information about currently viewed Bazar app
   */
  public constructor(
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<ViewPublishedComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppManifest) { }

  /**
   * Implementation of OnInit.
   */
   public ngOnInit() {

    // Verifying module has a README file.
    if (!this.data.readme || this.data.readme === '') {

      // Assigning some default text to show to user.
      this.readme = 'Module does not have a README file';

    } else {

      // Retrieving component's README file.
      this.configService.getReadMeFile(this.data).subscribe((result: Response) => {

        // Assigning model.
        this.readme = result.result;

      }, (error: any) => this.feedbackService.showError(error));
    }
  }

  /**
   * Invoked when dialog chould be closed.
   */
  public close() {

    // Closing dialog without passing in any data.
    this.dialogRef.close();
  }
}
