
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Model encapsulating name of folder you want to rename.
 */
export class FolderObjectName {

  /**
   * Name of folder to rename.
   */
  name: string;
}

/**
 * Component for renaming a folder.
 */
@Component({
  selector: 'app-rename-folder-dialog',
  templateUrl: './rename-folder-dialog.component.html'
})
export class RenameFolderDialogComponent {

  originalName: string;
  newName: string;

  constructor(
    private generalService: GeneralService,
    public dialogRef: MatDialogRef<RenameFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FolderObjectName) {
    let name = data.name.substring(0, data.name.length - 1);
    name = name.substring(name.lastIndexOf('/') + 1);
    this.originalName = name;
    this.newName = name;
  }

  ok() {

    if (!this.pathValid()) {
      this.generalService.showFeedback('Name is required and cannot contain blank space or special characters.', 'errorMessage', 'Ok', 5000);
      return;
    }
    if (this.data.name === this.originalName) {
      this.generalService.showFeedback('New name cannot be the same as the current name', 'errorMessage', 'Ok', 5000);
      return;
    }
    this.data.name = this.newName;
    this.dialogRef.close(this.newName);
  }

  cancel() {

    this.dialogRef.close();
  }

  pathValid() {

    if (!this.newName || this.newName.length === 0) {
      return false;
    }
    for (const idx of this.newName) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }
    return true
  }
}
