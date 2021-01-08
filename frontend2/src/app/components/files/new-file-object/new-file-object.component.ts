
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions.
import fileTypes from '../file-editor/file-types.json'

/**
 * Helper class for passing parameters in and out of modal dialog.
 */
export class FileObject {

  /**
   * If true, the user wants to create a folder, otherwise a file.
   */
  isFolder: boolean;

  /**
   * Name of file object user wants to create.
   */
  path?: string;
}

/**
 * Component for creating a new file system object, either a folder or a file.
 */
@Component({
  selector: 'app-new-file-object',
  templateUrl: './new-file-object.component.html'
})
export class NewFileObjectComponent {

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  /**
   * Creates an instance of your component.
   * 
   * @param data File object type and name.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: FileObject) { }

  /**
   * Returns true if the filename is valid, otherwise false.
   */
  public pathValid() {

    // Verifying user has typed a path at all.
    if (!this.data.path || this.data.path.length === 0) {
      return false;
    }

    // Verifying path doesn't contain invalid characters.
    for (const idx of this.data.path) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789_-.'.indexOf(idx) === -1) {
        return false;
      }
    }

    // If we're creating a folder, we've now sanity checked its name.
    if (this.data.isFolder) {
      return true;
    }

    // Verifying we have a CodeMirror editor for file extension.
    const extension = this.data.path.substr(this.data.path.lastIndexOf('.') + 1);
    const options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
    return options.length > 0;
  }
}
