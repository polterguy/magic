
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { AuthService } from '../../auth/services/auth.service';
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
   * @param clipboard Needed to be able to copy app direct download URL
   * @param configService Needed to be able to retrieve README file for module
   * @param feedbackService Needed to show user feedback
   * @param dialogRef Needed to be able to explicitly close dialog from TypeScript
   * @param data Information about currently viewed Bazar app
   */
  public constructor(
    private clipboard: Clipboard,
    public authService: AuthService,
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
   * Invoked when user wants to copy direct download URL for app.
   */
  public getUrl() {

    // Putting app's direct download URL unto clipboard and providing some feedback to caller.
    this.clipboard.copy(this.data.url);
    this.feedbackService.showInfo("App's direct download URL can be found on your clipboard");
  }

  /**
   * Invoked when a root user wants to remove app from Bazar,
   * no longer allowing others to download it and install it.
   */
  public removeAppFromBazar() {

    // Figuring out filename.
    let filename = this.data.url.substr(this.data.url.indexOf('?') + 1);
    filename = filename.substr(filename.indexOf('app=') + 4);
    filename = filename.split('&')[0];

    // Invoking backend to remove app from local Bazar.
    this.configService.deleteBazarApp(this.data.module_name, filename).subscribe(() => {

      // Closing dialog now since app no longer exists, and providing some feedback to user.
      this.feedbackService.showInfo('App successfully removed from your local Bazar');

      // Notice, this informs caller that app has been removed.
      this.dialogRef.close(this.data);
    });
  }

  /**
   * Invoked when dialog chould be closed.
   */
  public close() {

    // Closing dialog without passing in any data.
    this.dialogRef.close();
  }
}
