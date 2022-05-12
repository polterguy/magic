
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-pwa-update-dialog',
  templateUrl: './pwa-update-dialog.component.html',
  styleUrls: ['./pwa-update-dialog.component.scss']
})
export class PwaUpdateDialogComponent implements OnInit {

  constructor(
    private swUpdate: SwUpdate,
    private dialogRef: MatDialogRef<PwaUpdateDialogComponent>,
    private matDialog: MatDialog) { }

  ngOnInit(): void {
  }

  public reloadPage(): void {
    this.swUpdate.activateUpdate().then(() => {
      caches.keys().then(cs=>cs.forEach(c=>caches.delete(c)));
      this.dialogRef.close('install');
      document.location.reload();
    });
  }

  public remindLater() {
    this.dialogRef.close('later');
    setTimeout(() => {
      this.matDialog.open(PwaUpdateDialogComponent, {
        position: {top: '7px'},
        width: '500px',
        panelClass: ['pwa-update-panel'],
        hasBackdrop: false
      })
    }, 120000);
  }
}
