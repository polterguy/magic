
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
  }

  public checkForUpdates(): void {
    
    this.swUpdate.versionUpdates.subscribe(evt => {
      this.activateUpdate();
      // switch (evt.type) {

      //   case 'VERSION_DETECTED':
      //     this.matDialog.open(PwaUpdateDialogComponent, {
      //       position: {top: '7px'},
      //       width: '500px',
      //       panelClass: ['pwa-update-panel'],
      //       hasBackdrop: false
      //     })
          
      //     console.log(`Downloading new app version`);
      //     break;

      //   case 'VERSION_READY':
      //     console.log('ready')
      //     break;

      //   case 'VERSION_INSTALLATION_FAILED':
      //     console.log('failed')
      //     break;
      // }
    });
  }

  private activateUpdate() {
    const dialogExist = this.matDialog.getDialogById('message-pop-up');
    if (!dialogExist) {
      this.matDialog.open(PwaUpdateDialogComponent, {
        position: {top: '7px'},
        width: '500px',
        panelClass: ['pwa-update-panel'],
        hasBackdrop: false,
        id: 'message-pop-up'
      })
    }
  }
}