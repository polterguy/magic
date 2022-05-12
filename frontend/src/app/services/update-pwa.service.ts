
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { ApplicationRef, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat, first } from 'rxjs';
import { PwaUpdateDialogComponent } from '../components/utilities/pwa-update-dialog/pwa-update-dialog.component';

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
        interval(6 * 60 * 60).subscribe(() => swUpdate.checkForUpdate()
          .then(() => console.log('checking for updates')));
      }
    // if (swUpdate.isEnabled) {
    //   // Allow the app to stabilize first, before starting
    //   // polling for updates with `interval()`.
    //   const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
    //   const everySixHours$ = interval(5 * 60 * 1000);
    //   const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    //   everySixHoursOnceAppIsStable$.subscribe(() => swUpdate.checkForUpdate());
    // }
  }

  public checkForUpdates(): void {
    
    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {

        case 'VERSION_DETECTED':
          this.matDialog.open(PwaUpdateDialogComponent, {
            position: {top: '7px'},
            width: '500px',
            panelClass: ['pwa-update-panel'],
            hasBackdrop: false
          })
          
          console.log(`Downloading new app version`);
          break;

        case 'VERSION_READY':
          
          break;

        case 'VERSION_INSTALLATION_FAILED':
          
          break;
      }
    });
  }
}