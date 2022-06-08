
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BazarService } from '../../services/bazar.service';
import { Response } from '../../../../models/response.model';
import { ConfigService } from '../../../../services/config.service';
import { BazarApp } from '../../../../models/bazar-app.model';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { NameEmailModel } from '../../../../models/name-email.model';
import { PurchaseStatus } from '../../../../models/purchase-status.model';
import { FileService } from 'src/app/services/file.service';
import {
  ConfirmEmailAddressDialogComponent,
  EmailPromoCodeModel
} from './confirm-email-address-dialog/confirm-email-address-dialog.component';
import { ConfirmUninstallDialogComponent } from '../confirm-uninstall-dialog/confirm-uninstall-dialog.component';

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
  installed: boolean = false;

  /**
   * This is true if the user can install the app.
   *
   * Notice, apps are typically built for a "minimum version" of Magic in mind,
   * implying that the user might have a Magic version that is too old for a specific
   * version to be possible to install.
   */
  canInstall: boolean = false;

  /**
   * If Magic installation needs to be updated, this will be true.
   */
  needsCoreUpdate: boolean = false;

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to be able to display modal dialog
   * @param dialogRef Needed to be able close current dialog from code
   * @param fileService Needed to check if the app can be installed, or if another app/version is already installed with the same module folder name
   * @param bazarService Needed to actually purchase apps from Bazar
   * @param configService Needed to retrieve root user's email address
   * @param backendService Needed to verify user has access to install Bazar items
   * @param messageService Needed to publish messages for cases when app should be immediately installed.
   * @param feedbackService Needed to display errors to user
   * @param loaderService Needed to display loader animations to user
   * @param data Bazar app user wants to view details about
   */
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ViewAppDialogComponent>,
    private fileService: FileService,
    private bazarService: BazarService,
    private configService: ConfigService,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: BazarApp) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.fileService.listFolders('/modules/').subscribe({
      next: (folders: string[]) => {
        if (folders.filter(x => x === '/modules/' + this.data.folder_name + '/').length > 0) {
          this.installed = true;
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});

    this.bazarService.canInstall(this.data.min_magic_version).subscribe({
      next: (result: Response) => {
        if (result.result === 'SUCCESS') {
          this.canInstall = true;
        } else {
          this.feedbackService.showInfo('Incompatible with your Magic version');
          this.needsCoreUpdate = true;
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to purchase the specified app.
   */
  purchase() {
    this.configService.rootUserEmailAddress().subscribe({
      next: (response: NameEmailModel) => {
        const dialogRef = this.dialog.open(ConfirmEmailAddressDialogComponent, {
          width: '500px',
          data: {
            email: response.email,
            name: response.name,
            subscribe: true,
            code: this.data.price === 0 ? -1 : null
          }
        });
        dialogRef.afterClosed().subscribe((model: EmailPromoCodeModel) => {
          if (model) {
            this.bazarService.purchaseBazarItem(
              this.data,
              model.name,
              model.email,
              model.subscribe,
              model.code === -1 ? null : model.code).subscribe({
                next: (status: PurchaseStatus) => {
                  this.loaderService.show();

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
                    localStorage.setItem('currently-installed-app', JSON.stringify(this.data));
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
                    this.dialogRef.close();
                  } else {
                    this.feedbackService.showError(`Unknown status code returned from the Bazar, code was ${status.status}`);
                  }
              },
              error: (error: any) => this.feedbackService.showError(error)});
          }
        });

      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

}
