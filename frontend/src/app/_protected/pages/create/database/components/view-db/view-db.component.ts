
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BazarService } from 'src/app/_protected/services/bazar.service';
import { Response } from '../../../../../models/common/response.model';
import { BackendService } from 'src/app/_protected/services/backend.service';

@Component({
  selector: 'app-view-db',
  templateUrl: './view-db.component.html',
  styleUrls: ['./view-db.component.scss']
})
export class ViewDbComponent implements OnInit {

  public installed: boolean = false;
  public canInstall: boolean = false;
  public needsCoreUpdate: boolean = false;
  public deletePermission: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ViewDbComponent>,
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
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
              error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            });
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
