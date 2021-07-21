
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
   * @param bazarService Needed to actually purchase apps from Bazar
   * @param feedbackService Needed to display errors to user
   * @param data Bazar app user wants to view details about
   * @param dialogRef Needed to explicitly close dialog
   */
  constructor(
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

    // Retrieving user's email address, as he gave us when he configured Magic.
    this.configService.rootUserEmailAddress().subscribe((response: Response) => {

      // Asking user to confirm his email address.
      this.feedbackService.confirm(
        'Confirm your email address',
        `Is <strong>${response.result}</strong> your current email address? ` +
        'We must have your correct email address to ship the module to you. ' +
        'You can still use another email address as you login to PayPal.', () => {

          // Installing app.
          this.purchaseImpl(response.result);

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

    // Giving user some information and have him confirm he actually wants to go through with the purchase.
    this.feedbackService.confirm(
      'Opening up PayPal in another window',
      `You are about to purchase <strong>${this.data.name} for €${this.data.price}</strong>. ` +
      'This will open PayPal in another browser window. ' +
      `To purchase the ${this.data.name} module first accept the payment in PayPal, then close the PayPal ` +
      `window, and check your email inbox to verify you received a ZIP file containing the module. ` +
      'You can also install the module immediately afterwards on this page.' +
      '<br><br><strong>Do not close this window until purchase is complete.</strong>',
      () => {

        // Informing user that he needs to keep the window open to immediately install module.
        this.feedbackService.showInfo('If you keep this window open you can install module immediately after having paid');

        /*
         * Creating a SignalR socket connection to get notified in callbacks
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

            // Opening a new window with URL returned from purchase workflow.
            this.purchaseUrl = status.url;

          }, (error: any) => this.feedbackService.showError(error));

        });
      }
    );
  }
}
