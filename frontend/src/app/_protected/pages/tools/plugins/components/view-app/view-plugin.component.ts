import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BazarService } from 'src/app/_protected/services/common/bazar.service';
import { FileService } from '../../../../tools/hyper-ide/_services/file.service';
import { Response } from '../../../../../models/common/response.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-view-plugin',
  templateUrl: './view-plugin.component.html',
  styleUrls: ['./view-plugin.component.scss']
})
export class ViewPluginComponent implements OnInit {

  public installed: boolean = false;
  public canInstall: boolean = false;
  public needsCoreUpdate: boolean = false;
  public deletePermission: boolean = false;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ViewPluginComponent>,
    private fileService: FileService,
    private bazarService: BazarService,
    private generalService: GeneralService,
    private backendService: BackendService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.getAppDetails();
  }

  private getAppDetails() {
    this.bazarService.canInstall(this.data.min_magic_version).subscribe({
      next: (result: Response) => {
        this.deletePermission = this.backendService.active?.access.files.delete_folder;
        if (result.result === 'SUCCESS') {
          this.canInstall = true;
        } else {
          this.generalService.showFeedback('Incompatible with your Magic version', 'errorMessage', 'Ok', 5000);
          this.needsCoreUpdate = true;
        }
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /**
   * Invoked when user wants to update the app.
   */
  update() {
    this.bazarService.updateBazarItem(this.data).subscribe({
      next: (result: Response) => {
        if (result.result === 'success') {
          this.bazarService.installBazarItem(
            this.data.module_name,
            this.data.new_version,
            this.data.name,
            this.data.token).subscribe({
              next: (install: Response) => {
                if (install.result === 'success') {
                  this.generalService.showFeedback('Database was successfully updated.');
                  this.dialogRef.close();
                }
              },
              error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
            });
        }
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /**
   * Invoked when user wants to uninstall app from local server.
   */
  uninstall() {
    this.dialogRef.close('uninstall');
  }

  public install() {
    this.dialogRef.close('install');
  }
}
