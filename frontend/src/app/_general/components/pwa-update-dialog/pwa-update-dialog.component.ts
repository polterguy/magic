
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

/**
 * PWA update web app dialog, asking user if he or she wants to update the frontend.
 */
@Component({
  selector: 'app-pwa-update-dialog',
  templateUrl: './pwa-update-dialog.component.html'
})
export class PwaUpdateDialogComponent {

  constructor(
    private swUpdate: SwUpdate,
    private dialogRef: MatDialogRef<PwaUpdateDialogComponent>,
    private matDialog: MatDialog) { }

  reloadPage() {

    this.swUpdate.activateUpdate().then(() => {
      this.dialogRef.close();
      window.location.href = window.location.href;
    });
  }

  remindLater() {

    // Reminding user 5 minutes from now
    setTimeout(() => {
      this.matDialog.open(PwaUpdateDialogComponent, {
        position: { top: '7px' },
        width: '500px',
        panelClass: ['pwa-update-panel'],
        hasBackdrop: false
      });
    }, 1000 * 60 * 5);
    this.dialogRef.close();
  }
}
