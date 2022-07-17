
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BazarService } from '../../../management/services/bazar.service';
import { FileService } from 'src/app/services/file.service';
import { Response } from '../../../../models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BazarAppWrapper } from '../../../../models/bazar-app.model';

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
   * @param dialogRef Needed to be able close current dialog from code
   * @param fileService Needed to check if the app can be installed, or if another app/version is already installed with the same module folder name
   * @param bazarService Needed to actually purchase apps from Bazar
   * @param backendService Needed to verify user has access to install Bazar items
   * @param feedbackService Needed to display errors to user
   * @param data Bazar app user wants to view details about
   */
  constructor(
    private dialogRef: MatDialogRef<ViewAppDialogComponent>,
    private fileService: FileService,
    private bazarService: BazarService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: BazarAppWrapper) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.fileService.listFolders('/modules/').subscribe({
      next: (folders: string[]) => {
        if (folders.filter(x => x === '/modules/' + this.data.app.folder_name + '/').length > 0) {
          this.installed = true;
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});

    this.bazarService.canInstall(this.data.app.min_magic_version).subscribe({
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
    this.data.purchase(this.data.app, () => {
      this.dialogRef.close();
    });
  }
}
