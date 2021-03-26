
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper class for passing parameters in and out of modal dialog.
 */
export class RenameFileObject {

  /**
   * If true, the user wants to rename a folder, otherwise a file.
   */
  isFolder: boolean;

  /**
   * Old name of file object user wants to rename.
   */
  path: string;

  /**
   * New name of file object
   */
  newName: string;
}

/**
 * Component for renaming a file system object, either a folder or a file.
 */
@Component({
  selector: 'app-rename-file-object-dialog',
  templateUrl: './rename-file-object-dialog.component.html'
})
export class RenameFileObjectDialogComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param data File object type and name.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: RenameFileObject) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    const entities = this.data.path.split('/').filter(x => x !== '');
    this.data.newName = entities[entities.length - 1];
  }

  /**
   * Returns true if new filename or foldername is valid.
   */
  public isValid() {
    return this.data.newName.indexOf('/') === -1;
  }
}
