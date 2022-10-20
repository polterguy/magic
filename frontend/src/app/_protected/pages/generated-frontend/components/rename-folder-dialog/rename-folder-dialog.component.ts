
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  /**
   * Need to keep track of original filename to disable rename button
   * unless it's been changed.
   */
  originalName: string;

  /**
   * Databound value of new name to give folder.
   */
  newName: string;

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be abletoclose dialog
   * @param data Name of folder you want to rename
   */
  constructor(
    public dialogRef: MatDialogRef<RenameFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FolderObjectName) {
    let name = data.name.substring(0, data.name.length - 1);
    name = name.substring(name.lastIndexOf('/') + 1);
    this.originalName = name;
    this.newName = name;
  }

  /**
   * Invoked when user wants to close dialog and rename folder.
   */
  ok() {
    // let newName = this.data.name.substring(0, this.data.name.length - 1);
    // newName = newName.substring(0, newName.lastIndexOf('/')) + '/' + this.newName + '/';
    this.data.name = this.newName;
    this.dialogRef.close(this.newName);
  }

  /**
   * Invoked when user wants to close dialog without renaming folder.
   */
  cancel() {
    this.dialogRef.close();
  }

  /**
   * Returns true if path is valid.
   *
   * @returns True if path is valid
   */
  pathValid(){
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
