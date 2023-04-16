
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MagicResponse } from '../../../../../../_general/models/magic-response.model';
import { BazarService } from 'src/app/_general/services/bazar.service';

/**
 * View details modal dialog for showing user general information about some specific plugin.
 */
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
    private dialogRef: MatDialogRef<ViewPluginComponent>,
    private bazarService: BazarService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.getAppDetails();
  }

  private getAppDetails() {
    this.bazarService.canInstall(this.data.min_magic_version).subscribe({
      next: (result: MagicResponse) => {
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
      next: (result: MagicResponse) => {
        if (result.result === 'success') {
          this.bazarService.installBazarItem(
            this.data.module_name,
            this.data.new_version,
            this.data.name,
            this.data.token).subscribe({
              next: (install: MagicResponse) => {
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
