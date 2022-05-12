
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-pwa-update-dialog',
  templateUrl: './pwa-update-dialog.component.html',
  styleUrls: ['./pwa-update-dialog.component.scss']
})
export class PwaUpdateDialogComponent {

  constructor(
    private swUpdate: SwUpdate,
    private dialogRef: MatDialogRef<PwaUpdateDialogComponent>,
    private matDialog: MatDialog) { }

  public reloadPage(): void {
    this.swUpdate.activateUpdate().then(() => {
      this.dialogRef.close();
      // caches.keys().then(cs=>cs.forEach(c=>caches.delete(c)));
      window.location.href = window.location.href;
    });
  }

  public remindLater() {
    this.dialogRef.close('later');
  }
}
