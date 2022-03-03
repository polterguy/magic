
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NameEmailModel } from '../../../../models/name-email.model';

// Application specific imports.
import { BazarService } from '../../../../services/bazar.service';
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../../../services/config.service';

/**
 * Component allowing user to subscribe to Server Garden's newsletter.
 */
@Component({
  selector: 'app-subscribe-dialog',
  templateUrl: './subscribe-dialog.component.html'
})
export class SubscribeDialogComponent implements OnInit {

  /**
   * Name and email of user as published by backend.
   */
  public model: NameEmailModel;

  /**
   * Creates an instance of your component.
   * 
   * @param bazarService Needed to be able to subscribe user to our newsletter
   * @param configService Needed to retrieve user's name and email as specified during configuration
   * @param feedbackService Needed to display feedback to user
   * @param dialogRef Needed to be able to manually close dialog
   */
  public constructor(
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<SubscribeDialogComponent>) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving user's name and email from backend.
    this.configService.rootUserEmailAddress().subscribe((result: NameEmailModel) => {

      // Assigning model.
      this.model = result;

      // Checking if user has previously ordered a product, and or subscribed to our newsletter.
      const data = localStorage.getItem('confirm-email-data');
      if (data && data !== '') {

        // Updating model.
        const dataObj = JSON.parse(data);
        this.model.email = dataObj.email;
        this.model.name = dataObj.name;
      }
  
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the OK button.
   */
  public ok() {

    // Invoking Bazar service to subscribe to our newsletter.
    this.bazarService.subscribe(
      this.model.name,
      this.model.email).subscribe((result: Response) => {

        // Verifying invocation was a success.
        if (result.result === 'success') {

          // Providing feedback to user.
          this.feedbackService.showInfo('Please confirm your email address by clicking the link in the email we sent you');

        } else if (result.result === 'no-change') {

          // Providing feedback to user.
          this.feedbackService.showInfo('We could not add you to our newsletter, did you already subscribe previously?');

        } else if (result.result === 'please-confirm') {

          // Providing feedback to user.
          this.feedbackService.showInfo('We have already sent a confirm email to you. Please check your inbox for an email from ServerGardens.Com');
        }

        // Storing the fact that user has subscribed to newsletter in local storage.
        localStorage.setItem('subscribes-to-newsletter', JSON.stringify({
          subscribing: true,
        }));

        // Closing dialog.
        this.dialogRef.close(this.model);

      }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the Cancel button.
   */
  public cancel() {

    // Simply closing dialog without doing anything.
    this.dialogRef.close();
  }
}
