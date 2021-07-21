
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { BazarApp } from '../models/bazar-app.model';
import { BazarService } from '../services/bazar.service';
import { Response } from '../../../models/response.model';
import { environment } from 'src/environments/environment';
import { PurchaseStatus } from '../models/purchase-status.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';
import { BazarAppAvailable } from '../models/bazar-app-available.model';
import { ConfirmEmailAddressDialogComponent } from './confirm-email-address-dialog/confirm-email-address-dialog.component';

/**
 * View details of Bazar app modal dialog component.
 */
@Component({
  selector: 'app-view-app-dialog',
  templateUrl: './view-app-dialog.component.html',
  styleUrls: ['./view-app-dialog.component.scss']
})
export class ViewAppDialogComponent implements OnDestroy {

  /**
   * Purchase URL, typically leading to PayPal to pay for the app.
   */
  public purchaseUrl: string = null;

  /**
   * Download URL to download module directly.
   */
  public downloadUrl: string = null;

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app ise ready to be installed.
   */
  public hubConnection: HubConnection = null;

  /**
   * Once a purchase has been completed, this will encapsulate a download token,
   * allowing the user to download the app from the Bazar.
   */
  public token: string;

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
    @Inject(MAT_DIALOG_DATA) public data: BazarApp,
    private dialogRef: MatDialogRef<ViewAppDialogComponent>) { }

  /**
   * Implementation of OnDestroy is necessary to make sure we
   * stop any SignalR connections once the dialog is closed.
   */
  ngOnDestroy() {

    // Checking if we've got open SignalR connections.
    if (this.hubConnection) {

      // Stopping SignalR socket connection.
      this.hubConnection.stop();
    }
  }

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

      // If close method returns data, we know the app was installed.
      dialogRef.afterClosed().subscribe((email: string) => {

        // If user clicks cancel the dialog will not pass in any data.
        if (email) {

          // User confirmed his email address.
          this.purchaseImpl(email);
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to install the app, which is only possible when
   * he or she has received a valid download token, due to having accepted
   * the payment in PayPal.
   */
  public install() {

    // Downloading app from Bazar.
    this.bazarService.download(this.data, this.token).subscribe((download: Response) => {

      // Verifying process was successful.
      if (download.result === 'success') {

        // Now invoking install which actually initialises the app, and executes its startup files.
        this.bazarService.install(this.data.folder_name).subscribe((install: Response) => {

          // Verifying process was successful.
          if (install.result === 'success') {

            // Success!
            this.feedbackService.showInfo('Module was successfully installed on your server');
            this.dialogRef.close(this.data);

          } else {

            // Oops, some unspecified error occurred
            this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
          }
        });

      } else {

        // Oops, some unspecified error occurred
        this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
      }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to close dialog without installing app.
   */
  public close() {

    // Closing dialog without passing in any data to caller.
    this.dialogRef.close();
  }

  /*
   * Private helpers.
   */

  /*
   * Helper method that actually invokes Bazar to start purchasing workflow.
   */
  private purchaseImpl(email: string) {

    /*
     * Creating a SignalR socket connection to get notified in a callback
     * when PayPal has accepted the payment.
     */
    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(environment.bazarUrl + '/sockets', {
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    /*
     * Subscribing to SignalR message from Bazar that is published
     * once app is ready to be downloaded.
     */
    this.hubConnection.on('paypal.package.avilable.' + email, (args: string) => {

      // Purchase accepted by user.
      this.token = (<BazarAppAvailable>JSON.parse(args)).token;

      // Enabling download link.
      this.downloadUrl = environment.bazarUrl + '/magic/modules/paypal/download?token=' + this.token;
      
      // Notifying user of that he should check his email inbox.
      this.feedbackService.showInfo('We have sent the ZIP file containing your product to your email address');
    });

    // Connecting SignalR connection.
    this.hubConnection.start().then(() => {

      /*
        * Starting purchase flow.
        * Notice, to make sure we don't drop SignalR messages we do not do this before
        * we have successfully connected to SignalR hub.
        */
      this.bazarService.purchase(this.data, email).subscribe((status: PurchaseStatus) => {

        // Enabling the pay button now that we have a pay URL returned from PayPal.
        this.purchaseUrl = status.url;

        // Providing some feedback to user.
        this.feedbackService.showInfo('Click the Pay button to pay for module');

      }, (error: any) => this.feedbackService.showError(error));

    });
  }
}
