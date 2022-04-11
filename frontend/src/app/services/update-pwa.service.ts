
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { switchMap, interval } from 'rxjs';

/**
 * Update PWA service for letting users know about new update is available
 */
@Injectable({
  providedIn: 'root'
})
export class UpdatePwaService {

  constructor(
    private swUpdate: SwUpdate,
    private snackbar: MatSnackBar
  ) {
    if (swUpdate.isEnabled) {
      interval(6 * 60 * 60).subscribe(() => swUpdate.checkForUpdate()
        .then(() => console.log('checking for updates')));
    }
  }

  public checkForUpdates(): void {
    this.swUpdate.versionUpdates.subscribe(() => {
      const snack = this.snackbar.open('New version available! 🎉', 'Refresh');

      snack.onAction().pipe(switchMap(() => this.swUpdate.activateUpdate())).subscribe(() => {
        this.reloadPage();
      });
    });
  }

  private reloadPage(): void {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }

}