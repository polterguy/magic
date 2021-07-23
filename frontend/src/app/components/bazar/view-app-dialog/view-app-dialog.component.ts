
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BazarApp } from '../models/bazar-app.model';
import { BazarService } from '../services/bazar.service';
import { Response } from '../../../models/response.model';
import { PurchaseStatus } from '../models/purchase-status.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';
import { ConfirmEmailAddressDialogComponent } from './confirm-email-address-dialog/confirm-email-address-dialog.component';

/**
 * View details of Bazar app modal dialog component.
 */
@Component({
  selector: 'app-view-app-dialog',
  templateUrl: './view-app-dialog.component.html',
  styleUrls: ['./view-app-dialog.component.scss']
})
export class ViewAppDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to be able to display modal dialog
   * @param bazarService Needed to actually purchase apps from Bazar
   * @param configService Needed to retrieve root user's email address
   * @param feedbackService Needed to display errors to user
   * @param data Bazar app user wants to view details about
   * @param dialogRef Needed to explicitly close dialog
   */
  constructor(
    private dialog: MatDialog,
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: BazarApp) { }

  /**
   * Invoked when user wants to purchase the specified app.
   */
  public purchase() {

    // Retrieving user's email address, as provided when he configured Magic.
    this.configService.rootUserEmailAddress().subscribe((response: Response) => {

      // Opening up modal dialog to make sure we get root user's correct email address.
      const dialogRef = this.dialog.open(ConfirmEmailAddressDialogComponent, {
        width: '500px',
        data: response.result,
      });

      // Waiting for the user to close modal dialog.
      dialogRef.afterClosed().subscribe((email: string) => {

        // If user clicks cancel the dialog will not pass in any data.
        if (email) {

          // Providing some feedback to user.
          this.feedbackService.showInfo('Please wait while we redirect you to PayPal');

          /*
           * Starting purchase flow.
           */
          this.bazarService.purchase(this.data, email).subscribe((status: PurchaseStatus) => {

            // Storing currently viewed app in local storage to make it more easily retrieved during callback.
            localStorage.setItem('currently-inctalled-app', JSON.stringify(this.data));

            // Re-directing to PayPal.
            window.location.href = status.url;

          }, (error: any) => this.feedbackService.showError(error));
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
