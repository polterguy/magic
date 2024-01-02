
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

// Application specific imports.
import { FileService } from 'src/app/services/file.service';
import { GeneralService } from 'src/app/services/general.service';

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
  name: string;

  /**
   * Path where user wants to create file object.
   */
  path: string;

  /**
   * All existing folders in system.
   */
  folders: string[];

  /**
   * All existing files in system.
   */
  files: string[];

  /**
   * Type of the dialog
   */
  type: string;
}

/**
 * Component for creating a new file system object, either a folder or a file.
 */
@Component({
  selector: 'app-new-file-folder-dialog',
  templateUrl: './new-file-folder-dialog.component.html',
  styleUrls: ['./new-file-folder-dialog.component.scss']
})
export class NewFileFolderDialogComponent {

  constructor(
    private fileService: FileService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: FileObject) { }

  getFileName(path: string) {

    return path.substring(path.lastIndexOf('/') + 1);
  }

  pathValid() {

    if (!this.data.name || this.data.name.length === 0) {
      return false;
    }
    if (this.data.isFolder) {
      return this.data.folders.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase() + '/').length === 0;
    } else {
      return this.data.files.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase()).length === 0;
    }
  }
}
