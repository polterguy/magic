
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { ApplicationRef, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat, first } from 'rxjs';
import { PwaUpdateDialogComponent } from '../components/pwa-update-dialog/pwa-update-dialog.component';

/**
 * Update PWA service for letting users know about new update is available
 */
@Injectable({
  providedIn: 'root'
})
export class UpdatePwaService {

  constructor(
    appRef: ApplicationRef,
    private swUpdate: SwUpdate,
    private matDialog: MatDialog) {

    if (swUpdate.isEnabled) {
      const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
      const everySixHours$ = interval(5 * 60 * 1000);
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);
      everySixHoursOnceAppIsStable$.subscribe(() => swUpdate.checkForUpdate());
    }
  }

  checkForUpdates() {

    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {

        case 'VERSION_DETECTED':

          console.log(`Downloading new app version`);
          break;

        case 'VERSION_READY':
          console.log('ready')
          this.activateUpdate();
          break;

        case 'VERSION_INSTALLATION_FAILED':
          console.log('failed')
          break;
      }
    });
  }

  /*
   * Private helper methods.
   */

  private activateUpdate() {
    const dialogExist = this.matDialog.getDialogById('message-pop-up');
    if (!dialogExist) {
      this.matDialog.open(PwaUpdateDialogComponent, {
        panelClass: ['pwa-update-panel'],
        disableClose: true,
        id: 'message-pop-up'
      })
    }
  }
}
