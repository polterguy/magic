
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { forkJoin, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationRef, Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { FeedbackService } from '../../services/feedback.service';
import { MessageService } from 'src/app/services/message.service';
import { FileService } from 'src/app/components/files/services/file.service';
import { DownloadFileDialogComponent } from './download-file-dialog/download-file-dialog.component';
import { FileObject, NewFileObjectDialogComponent } from './new-file-object-dialog/new-file-object-dialog.component';
import { RenameFileObject, RenameFileObjectDialogComponent } from './rename-file-object-dialog/rename-file-object-dialog.component';
import { AuthService } from '../auth/services/auth.service';

/**
 * Files component to allow user to browse his dynamic files folder,
 * and edit and modify its content.
 */
@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit, OnDestroy {

  private subscriber: Subscription;

  /**
   * Displayed columns in data table.
   */
  public displayedColumns: string[] = [
    'icon',
    'path',
    'rename',
    'download',
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
   * Model for file uploader.
   */
  public fileInput: string[];

  /*
   * If this one is true, CodeMirror is in fullscreen mode.
   */
  public codeMirrorIsFullscreen = false;

  /*
   * CSS class to use for files table.
   */
  public tableCssClass = 'files clickable';

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display messages to user
   * @param messageService Needed to signal changes to the parent folder
   * @param authService Needed to verify access to components
   * @param dialog Used to open new file object dialog to create new folders or files
   * @param fileService File service used to retrieve files and folders from backend
   */
  constructor(
    private feedbackService: FeedbackService,
    protected messageService: MessageService,
    public authService: AuthService,
    private fileService: FileService,
    private applicationRef: ApplicationRef,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving files from backend to initially display to user.
    this.getFolderContent();

    // Making sure we subscribe to changes in current folder.
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {
      switch (msg.name) {

        case 'files.folder.changed':
          this.getFolderContent();
          break;

        case 'codemirror.fullscreen-toggled':

          // Tiny trick to make sure toolbar buttons doesn't obstruct CodeMirror editor.
          if (msg.content === true) {
            this.codeMirrorIsFullscreen = true;
            this.tableCssClass = 'files clickable code-mirror-fullscreen';
          } else {
            this.codeMirrorIsFullscreen = false;
            this.tableCssClass = 'files clickable';
          }
          this.applicationRef.tick();
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {
    
    // Making sure we unsubscribe to subscriber.
    this.subscriber.unsubscribe();
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
   * Returns true if user can delete item.
   * 
   * @param path Item to check
   */
  public canDeleteItem(path: string) {

    // Preventing deletion of important system modules.
    switch (path) {
      case '/temp/':
      case '/misc/':
      case '/modules/':
      case '/modules/magic/':
      case '/system/':
        return false;
      default:
        return true;
    }
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
   * Invoked when user wants to rename a folder or a file.
   * 
   * @param event Click event
   * @param path Folder or file to rename
   */
  public rename(event: any, path: string) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Showing modal dialog.
    const dialogRef = this.dialog.open(RenameFileObjectDialogComponent, {
      width: '550px',
      data: {
        isFolder: this.isFolder(path),
        path: path,
      },
    });

    // Subscribing to closed event and creating a new folder if we're given a folder name.
    dialogRef.afterClosed().subscribe((result: RenameFileObject) => {

      // Verifying user clicked rename button
      if (result) {

        // Invoking backend to rename file or folder.
        this.fileService.rename(result.path, result.newName).subscribe(() => {

          // Showing user some information and retrieving items again.
          this.feedbackService.showInfo((result.isFolder ? 'Folder' : 'File') + ' was renamed');
          this.getFolderContent();

        }, (error: any) => {

          // Oops ...!!
          this.feedbackService.showError(error);
        });
      }
    });
  }

  /**
   * Downloads a file or a folder from your backend.
   * 
   * @param event Click event
   * @param path File or folder to download
   */
  public download(event: any, path: string) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Checking if this is a file or a folder, and acting accordingly.
    if (this.isFolder(path)) {

      // Downloading folder.
      this.fileService.downloadFolder(path);

    } else {

      // Downloading file.
      this.fileService.downloadFile(path);
    }
  }

  /**
   * Deletes a file or a folder in your backend.
   * 
   * @param event Click event, needed to stop propagation
   * @param path File or folder to delete
   */
  public delete(event: any, path: string) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Asking user to confirm deletion of file object.
    this.feedbackService.confirm(
      'Please confirm delete operation',
      `Are you sure you want to delete the '${this.getItemName(path)}' ${this.isFolder(path) ? 'folder' : 'file'}?`,
      () => {

        // Checking if this is a file or a folder, and acting accordingly.
        if (this.isFolder(path)) {

          // Deleting specified folder.
          this.fileService.deleteFolder(path).subscribe(() => {

            // Giving feedback to user and re-retrieving folder's content.
            this.feedbackService.showInfoShort('Folder deleted');
            this.getFolderContent();
          }, (error: any) => this.feedbackService.showError(error));

        } else {

          // Deleting specified file.
          this.fileService.deleteFile(path).subscribe(() => {

            // Giving feedback to user and re-retrieving folder's content.
            this.feedbackService.showInfoShort('File deleted');
            this.getFolderContent();
          }, (error: any) => this.feedbackService.showError(error));
        }
    });
  }

  /**
   * Returns true if this is a module folder.
   */
  public isModuleFolder() {
    const elements = this.currentFolder.split('/');
    return elements.length === 4 && elements[1] === 'modules';
  }

  /**
   * Re-installs module by running startup Hyperlambda files.
   */
  public installModule() {

    // Invoking backend to install the folder.
    this.fileService.install(this.currentFolder).subscribe(() => {

      // Showing user some feedback.
      this.feedbackService.showInfo('Module was successfully installed');
    }, (error: any) => this.feedbackService.showError(error));
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
    const dialogRef = this.dialog.open(NewFileObjectDialogComponent, {
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

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to download a file directly to server.
   */
  public downloadFileToServer() {

    // Showing a modal dialog allowing user to provide us with a download URL.
    const dialogRef = this.dialog.open(DownloadFileDialogComponent, {
      width: '550px',
      data: this.currentFolder,
    });

    // Subscribing to closed event such that we can refresh current folder if user clicked the download button.
    dialogRef.afterClosed().subscribe((result: any) => {

      // Checking if user actually downloaded anything.
      if (result) {

        // Success, re-retrieving folder's content.
        this.getFolderContent();
      }
    });
  }

  /**
   * Invoked when user wants to create a new file.
   */
  public newFile() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewFileObjectDialogComponent, {
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
          this.getFolderContent(this.currentFolder + path.path);

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Uploads one or more files to the currently active folder.
   */
  public upload(files: FileList) {

    // Iterating through each file and uploading one file at the time.
    for (let idx = 0; idx < files.length; idx++) {

      // Invoking service method responsible for actually uploading file.
      this.fileService.uploadFile(this.currentFolder, files.item(idx)).subscribe(() => {

        // Showing some feedback to user, and re-databinding folder's content.
        this.feedbackService.showInfo('File was successfully uploaded');
        this.fileInput = null;
        this.getFolderContent();
      });
    }
  }

  /*
   * Private helper methods
   */

  /*
   * Retrieves the content of the currently viewed folder, and databinds UI.
   */
  private getFolderContent(initialFile: string = null) {

    // Retrieving files and folders from backend.
    const foldersObservable = this.fileService.listFolders(this.currentFolder);
    const filesObservable = this.fileService.listFiles(this.currentFolder);
    forkJoin([foldersObservable, filesObservable]).subscribe((res: string[][]) => {

      // Assigning return values of above observers to related fields.
      this.items = (res[0] || []).concat(res[1] || []);

      // Making sure we reset edited files.
      if (initialFile) {
        this.editedFiles = [initialFile];
      } else {
        this.editedFiles = [];
      }

    }, (error: any) => this.feedbackService.showError(error));
  }
}
