
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { FileService } from 'src/app/services/file.service';
import { MessageService } from 'src/app/services/message.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm/confirm-dialog.component';
import { FileObject, NewFileObjectComponent } from './new-file-object/new-file-object.component';

/**
 * Files component to allow user to browse his dynamic files folder,
 * and edit and modify its content.
 */
@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent extends BaseComponent implements OnInit {

  /**
   * Displayed columns in data table.
   */
  public displayedColumns: string[] = [
    'icon',
    'path',
    'delete',
  ];

  /**
   * Current folder we're viewing contens of.
   */
  public currentFolder = '/';

  /**
   * Folders and files inside currently viewed folder.
   */
  public items: string[] = null;

  /**
   * Files that are currently being edited.
   */
  public editedFiles: string[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Used to open new file object dialog to create new folders or files
   * @param fileService File service used to retrieve files and folders from backend
   * @param messageService Used to send and retrieve messages from other components.
   */
  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving files from backend to initially display to user.
    this.getFolderContent();
  }

  /**
   * Returns filename or folder name of specified path.
   * 
   * @param path Path to return object name for
   */
  public getItemName(path: string) {
    const elements = path.split('/').filter(x => x !== '');
    return elements[elements.length - 1];
  }

  /**
   * Returns true if given path is a folder
   * 
   * @param path What path to check
   */
  public isFolder(path: string) {
    return path.endsWith('/');
  }

  /**
   * Invoked when a path item, such as a file or folder is clicked.
   * 
   * @param path Item that was clicked
   */
  public itemClicked(path: string) {

    // Checking what type of item that was clicked.
    if (this.isFolder(path)) {

      // Open the specified folder.
      this.currentFolder = path;
      this.getFolderContent();

    } else {

      // Checking if we're already displaying details for current item.
      const idx = this.editedFiles.indexOf(path);
      if (idx !== -1) {

        // Hiding item.
        this.editedFiles.splice(idx, 1);
      } else {

        // Displaying item.
        this.editedFiles.push(path);
      }
    }
  }

  /**
   * Deletes a file or a folder in your backend.
   * 
   * @param path File or folder to delete
   */
  public delete(event: any, path: string) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Asking user to confirm deletion of file object.
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        text: `Are you sure you want to delete the '${this.getItemName(path)}' ${this.isFolder(path) ? 'folder' : 'file'}?`,
        title: 'Please confirm delete operation'
      }
    });

    // Subscribing to close such that we can delete user if it's confirmed.
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {

      // Checking if user confirmed that he wants to delete the file object.
      if (result && result.confirmed) {

        // Checking if this is a file or a folder, and acting accordingly.
        if (this.isFolder(path)) {

          // Deleting specified folder.
          this.fileService.deleteFolder(path).subscribe(() => {

            // Giving feedback to user and re-retrieving folder's content.
            this.showInfoShort('Folder deleted');
            this.getFolderContent();
          }, (error: any) => this.showError(error));

        } else {

          // Deleting specified file.
          this.fileService.deleteFile(path).subscribe(() => {

            // Giving feedback to user and re-retrieving folder's content.
            this.showInfoShort('File deleted');
            this.getFolderContent();
          }, (error: any) => this.showError(error));
        }
      }
    });
  }

  /**
   * Invoked when user wants to go up one level from his current folder.
   */
  public up() {

    // Fiding all folders we're inside of.
    const elements = this.currentFolder.split('/').filter(x => x !== '');

    // Removing last folder, and prepending '/'.
    let newFolder = '/' + elements.slice(0, elements.length - 1).join('/');

    // Checking if this is not root folder, at which point we append another '/' at the end.
    if (newFolder !== '/') {
      newFolder += '/';
    }

    // Updating current folder, and re-retrieving items for folder.
    this.currentFolder = newFolder;
    this.getFolderContent();
  }

  /**
   * Returns true if specified file is currently being edited.
   * 
   * @param file File to check
   */
  public isEditing(file: string) {
    return this.editedFiles.indexOf(file) !== -1;
  }

  /**
   * Invoked when user wants to create a new folder.
   */
  public newFolder() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewFileObjectComponent, {
      width: '550px',
      data: {
        isFolder: true,
        path: null,
      },
    });

    // Subscribing to closed event and creating a new folder if we're given a folder name.
    dialogRef.afterClosed().subscribe((path: FileObject) => {

      // Checking if we were given a new file object name, at which point the user wants to create a new folder.
      if (path && path.path) {

        // Creating a new folder with the specified name.
        this.fileService.createFolder(this.currentFolder + path.path).subscribe(() => {

          // Success, re-retrieving folder's content.
          this.getFolderContent();

        }, (error: any) => this.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to create a new file.
   */
  public newFile() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewFileObjectComponent, {
      width: '550px',
      data: {
        isFolder: false,
        path: null,
      },
    });

    // Subscribing to closed event and creating a new file if we're given a file name.
    dialogRef.afterClosed().subscribe((path: FileObject) => {

      // Checking if we were given a new file object name, at which point the user wants to create a new file.
      if (path && path.path) {

        // Creating a new file with the specified name and some default content.
        this.fileService.saveFile(this.currentFolder + path.path, '/* Initial content, please change */').subscribe(() => {

          // Success, re-retrieving folder's content.
          this.getFolderContent();

        }, (error: any) => this.showError(error));
      }
    });
  }

  /*
   * Private helper methods
   */

  /*
   * Retrieves the content of the currently viewed folder, and databinds UI.
   */
  private getFolderContent() {

    // Retrieving files and folders from backend.
    const foldersObservable = this.fileService.listFolders(this.currentFolder);
    const filesObservable = this.fileService.listFiles(this.currentFolder);
    forkJoin([foldersObservable, filesObservable]).subscribe((res: string[][]) => {

      // Assigning return values of above observers to related fields.
      this.items = (res[0] || []).concat(res[1] || []);

      // Making sure we reset edited files.
      this.editedFiles = [];

    }, (error: any) => this.showError(error));
  }
}
