
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model encapsulating name of file or folder you want to rename.
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
  templateUrl: './rename-file-dialog.component.html',
  styleUrls: ['./rename-file-dialog.component.scss']
})
export class RenameFileDialogComponent {

  /**
   * Need to keep track of original filename to disable rename button
   * unless it's been changed.
   */
  public originalName: string;

  /**
   * Creates an instance of your component.
   * 
   * @param data Name of file or folder you want to rename
   */
  constructor(
    public dialogRef: MatDialogRef<RenameFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileObjectName) {
      this.originalName = data.name;
    }

  /**
   * Invoked when user wants to close dialog without renaming file.
   */
   public ok() {

    // Closing dialog.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user wants to close dialog without renaming file.
   */
  public cancel() {

    // Closing dialog.
    this.dialogRef.close();
  }
}
