
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Model encapsulating name of file you want to rename.
 */
export class FileObjectName {

  /**
   * Filename of file
   */
  name: string;
}

/**
 * Component for renaming a file.
 */
@Component({
  selector: 'app-rename-file-dialog',
  templateUrl: './rename-file-dialog.component.html'
})
export class RenameFileDialogComponent {

  originalName: string;

  constructor(
    private generalService: GeneralService,
    public dialogRef: MatDialogRef<RenameFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileObjectName) {
    this.originalName = data.name;
  }

  ok() {

    if (!this.pathValid()) {
      this.generalService.showFeedback('Name is required and cannot contain blank space or special characters', 'errorMessage', 'Ok', 5000);
      return;
    }
    if (this.data.name === this.originalName) {
      this.generalService.showFeedback('New name cannot be the same as the current name', 'errorMessage', 'Ok', 5000);
      return;
    }
    this.dialogRef.close(this.data);
  }

  pathValid() {

    if (!this.data.name || this.data.name.length === 0) {
      return false;
    }
    for (const idx of this.data.name) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }
    return true
  }
}
