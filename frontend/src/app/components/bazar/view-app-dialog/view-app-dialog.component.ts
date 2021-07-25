
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BazarApp } from '../models/bazar-app.model';
import { BazarService } from '../services/bazar.service';
import { Response } from '../../../models/response.model';
import { FileService } from '../../files/services/file.service';
import { PurchaseStatus } from '../models/purchase-status.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';
import { NameEmailModel } from '../../config/models/name-email.model';
import { ConfirmEmailAddressDialogComponent, EmailPromoCodeModel } from './confirm-email-address-dialog/confirm-email-address-dialog.component';

/**
 * View details of Bazar app modal dialog component.
 */
@Component({
  selector: 'app-view-app-dialog',
  templateUrl: './view-app-dialog.component.html',
  styleUrls: ['./view-app-dialog.component.scss']
})
export class ViewAppDialogComponent implements OnInit {

  /**
   * If true, this app has already been installed.
   */
  public installed: boolean = false;

  /**
   * This is true if the user can install the app.
   * 
   * Notice, apps are typically built for a "minimum version" of Magic in mind,
   * implying that the user might have a Magic version that is too old for a specific
   * version to be possible to install.
   */
  public canInstall: boolean = false;

  /**
   * If Magic installation needs to be updated, this will be true.
   */
  public needsCoreUpdate: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to be able to display modal dialog
   * @param dialogRef Needed to be able close current dialog from code
   * @param fileService Needed to check if the app can be installed, or if another app/version is already installed with the same module folder name
   * @param bazarService Needed to actually purchase apps from Bazar
   * @param configService Needed to retrieve root user's email address
   * @param messageService Needed to publish messages for cases when app should be immediately installed.
   * @param feedbackService Needed to display errors to user
   * @param data Bazar app user wants to view details about
   */
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ViewAppDialogComponent>,
    private fileService: FileService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: BazarApp) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Checking if module is already installed.
    this.fileService.listFolders('/modules/').subscribe((folders: string[]) => {

      // Checking if invocation returned folder name of currently viewed app.
      if (folders.filter(x => x === '/modules/' + this.data.folder_name + '/').length > 0) {

        // Module is not installed.
        this.installed = true;
      }
    }, (error: any) => this.feedbackService.showError(error));

    // Verifying that the application can be installed in the current version of Magic.
    this.fileService.canInstall(this.data.min_magic_version).subscribe((result: Response) => {

      // Assigning model accordingly.
      if (result.result === 'SUCCESS') {

        /*
         * This app can be installed, since the current Magic version
         * is equal to or higher than the minimum Magic version the app requires
         * to function correctly.
         */
        this.canInstall = true;

      } else {

        // Notifying user that the application cannot be installed.
        this.feedbackService.showInfo('In order to install this app you will have to update your Magic version');
        this.needsCoreUpdate = true;
      }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to purchase the specified app.
   */
  public purchase() {

    // Retrieving user's email address, as provided when he configured Magic.
    this.configService.rootUserEmailAddress().subscribe((response: NameEmailModel) => {

      // Opening up modal dialog to make sure we get root user's correct email address.
      const dialogRef = this.dialog.open(ConfirmEmailAddressDialogComponent, {
        width: '500px',
        data: {
          email: response.email,
          name: response.name,
          subscribe: true,
          code: this.data.price === 0 ? -1 : null
        }
      });

      // Waiting for the user to close modal dialog.
      dialogRef.afterClosed().subscribe((model: EmailPromoCodeModel) => {

        // If user clicks cancel the dialog will not pass in any data.
        if (model) {

          /*
           * Starting purchase flow.
           */
          this.bazarService.purchase(
            this.data,
            model.name,
            model.email,
            model.subscribe,
            model.code === -1 ? null : model.code).subscribe((status: PurchaseStatus) => {

              /*
               * Checking if status is 'PENDING' at which point we'll have to redirect to PayPal
               * to finish transaction.
               */
              if (status.status === 'PENDING') {

                /*
                 * We'll need to redirect user to PayPal to accept the transaction.
                 * Hence, storing currently viewed app in local storage to make it more
                 * easily retrieved during callback.
                 */
                localStorage.setItem('currently-inctalled-app', JSON.stringify(this.data));

                // Re-directing to PayPal.
                window.location.href = status.url;

              } else if (status.status === 'APPROVED') {

                /*
                 * App can immediately be installed, and status.token contains
                 * download token.
                 */
                this.messageService.sendMessage({
                  name: 'magic.bazar.install-immediately',
                  content: {
                    app: this.data,
                    code: status.code,
                  }
                });

                // Closing modal dialog.
                this.dialogRef.close();

              } else {

                // Unknown status code returned from Bazar.
                this.feedbackService.showError(`Unknown status code returned from the Bazar, code was ${status.status}`);
              }

          }, (error: any) => this.feedbackService.showError(error));
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
