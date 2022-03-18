
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { AppManifest } from '../../../../models/app-manifest';
import { AuthService } from '../../../../services/auth.service';
import { FileService } from 'src/app/services/tools/file.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BazarService } from '../../../../services/management/bazar.service';

/**
 * Displays information about a currently installed Bazar item.
 */
@Component({
  selector: 'app-view-installed-app-dialog',
  templateUrl: './view-installed-app-dialog.component.html',
  styleUrls: ['./view-installed-app-dialog.component.scss']
})
export class ViewInstalledAppDialogComponent implements OnInit {

  /**
   * Markdown fetched from app's README.md file.
   */
  markdown: string;

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to display module's README file
   * @param authService Needed verify user has access to components
   * @param bazarService Needed to be able to update app, if app needs updating
   * @param backendService Needed to verify user has access to delete/uninstall Bazar item
   * @param feedbackService Needed to display feedback to user.
   * @param data App's manifest or meta data
   * @param dialogRef Needed to manually close dialog from code
   */
  constructor(
    private fileService: FileService,
    public authService: AuthService,
    private bazarService: BazarService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: AppManifest,
    private dialogRef: MatDialogRef<ViewInstalledAppDialogComponent>) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.fileService.listFiles(
      '/modules/' + this.data.module_name + '/',
      'README.md').subscribe((result: string[]) => {
      if (result && result.length > 0) {
        this.fileService.loadFile(
          '/modules/' + this.data.module_name +
          '/README.md').subscribe((markdown: string) => {
            this.markdown = markdown;
          }, (error: any) => this.feedbackService.showError(error));
      }
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to update the app.
   */
  update() {
    this.bazarService.updateBazarItem(this.data).subscribe((result: Response) => {
      if (result.result === 'success') {
        this.bazarService.installBazarItem(
          this.data.module_name,
          this.data.new_version,
          this.data.name,
          this.data.token).subscribe((install: Response) => {
          if (install.result === 'success') {
            this.feedbackService.showInfo('Application was successfully updated. You probably want to store the ZIP file for later in case you need to install a backup of your app.');
            this.dialogRef.close(this.data);
            this.bazarService.downloadBazarItemLocally(this.data.module_name);
          }
        }, (error: any) => this.feedbackService.showError(error));
      }
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to uninstall app from local server.
   */
  uninstall() {
    this.fileService.deleteFolder('/modules/' + this.data.module_name + '/').subscribe((result: Response) => {
      this.feedbackService.showInfo('Application was successfully uninstalled from local server');
      this.dialogRef.close(this.data);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to close dialog.
   */
  close() {
    this.dialogRef.close();
  }
}
