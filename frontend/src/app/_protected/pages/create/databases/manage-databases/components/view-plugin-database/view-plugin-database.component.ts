
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MagicResponse } from '../../../../../../../_general/models/magic-response.model';
import { BazarService } from 'src/app/_general/services/bazar.service';

/**
 * Helper component showing user information about some specified plugin database that can
 * be installed from the Bazar.
 */
@Component({
  selector: 'app-view-plugin-database',
  templateUrl: './view-plugin-database.component.html',
  styleUrls: ['./view-plugin-database.component.scss']
})
export class ViewPluginDatabaseComponent implements OnInit {

  public installed: boolean = false;
  public canInstall: boolean = false;
  public needsCoreUpdate: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ViewPluginDatabaseComponent>,
    private bazarService: BazarService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    this.getAppDetails();
  }

  updatePlugin() {

    this.generalService.showLoading();
    this.bazarService.updateBazarItem(this.data).subscribe({
      next: (result: MagicResponse) => {

        if (result.result === 'success') {
          this.bazarService.installBazarItem(
            this.data.module_name,
            this.data.new_version,
            this.data.name,
            this.data.token).subscribe({
              next: (install: MagicResponse) => {

                this.generalService.hideLoading();
                if (install.result === 'success') {
                  this.generalService.showFeedback('Database was successfully updated.');
                  this.dialogRef.close();
                }
              },
              error: (error: any) => {

                this.generalService.hideLoading();
                this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
              }
            });
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  uninstall() {

    this.dialogRef.close('uninstall');
  }

  install() {

    this.dialogRef.close('install');
  }

  /*
   * Private helper methods.
   */

  private getAppDetails() {

    this.generalService.showLoading();
    this.bazarService.canInstall(this.data.min_magic_version).subscribe({
      next: (result: MagicResponse) => {

        this.generalService.hideLoading();
        if (result.result === 'SUCCESS') {
          this.canInstall = true;
        } else {
          this.generalService.showFeedback('Incompatible with your Magic version', 'errorMessage', 'Ok', 5000);
          this.needsCoreUpdate = true;
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
