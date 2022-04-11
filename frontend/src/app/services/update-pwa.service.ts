
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { switchMap, first, interval } from 'rxjs';

/**
 * Update PWA service for letting users know about new update
 */
@Injectable({
  providedIn: 'root'
})
export class UpdatePwaService {

  constructor(
    private swUpdate: SwUpdate,
    private snackbar: MatSnackBar,
    appRef: ApplicationRef
  ) {
    if (this.swUpdate.versionUpdates) {
      this.swUpdate.versionUpdates.subscribe(() => {
        const snack = this.snackbar.open('New version available!', 'Refresh');

        snack.onAction().pipe(switchMap(() => this.swUpdate.activateUpdate())).subscribe(() => {
          window.location.reload();
        });
      });
    }

  }
}