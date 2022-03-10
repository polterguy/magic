
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output
} from '@angular/core';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { Response } from '../../../../../models/response.model';
import { FileService } from 'src/app/services/tools/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { MacroDefinition } from 'src/app/models/macro-definition.model';
import { FileObjectName } from '../../rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../../rename-folder-dialog/rename-folder-dialog.component';
import { ExecuteMacroDialogComponent } from '../../execute-macro-dialog/execute-macro-dialog.component';
import { SelectMacroDialogComponent, Macro } from '../../select-macro-dialog/select-macro-dialog.component';
import { NewFileFolderDialogComponent, FileObject } from '../../new-file-folder-dialog/new-file-folder-dialog.component';

/**
 * Folder actions component for allowing user to execute actions for selected folders in Hyper IDE.
 */
@Component({
  selector: 'app-folder-actions',
  templateUrl: './folder-actions.component.html',
  styleUrls: ['./folder-actions.component.scss']
})
export class FolderActionsComponent {

  @Input() activeFolder: string;
  @Input() getFolders: any;
  @Input() getFiles: any;
  @Output() manageAfterCreateNewFileObject: EventEmitter<any> = new EventEmitter();
  @Output() updateFiles: EventEmitter<any> = new EventEmitter();
  @Output() updateAfterDelete: EventEmitter<any> = new EventEmitter();
  @Output() updateAfterMacro: EventEmitter<any> = new EventEmitter();
  @Output() afterRenamingFolder: EventEmitter<any> = new EventEmitter();

  /**
   * Model for file uploader.
   */
   public fileInput: string[];
   public zipFileInput: any;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogs
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param ngZone Needed to make sure dialogs popup inside the ngZone
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private fileService: FileService,
    private feedbackService: FeedbackService,
    readonly ngZone: NgZone
  ) { }

  /**
   * Invoked when user wants to create a new file or folder.
   * @param type to specify the type of new object: file | folder
   * @callback manageAfterCreateNewFileObject to update view in parent component
   */
   public createNewFileObject(type: string) {

    // Retrieving all existing folders in system to allow user to select folder to create object within.
    const folders = this.getFolders;

    // Retrieving all existing files to prevent user from creating a new file that already exists.
    const files = this.getFiles;

    // Creating modal dialog responsible for asking user for name and type of object.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      const dialogRef = this.dialog.open(NewFileFolderDialogComponent, {
        width: '550px',
        data: {
          isFolder: false,
          name: '',
          path: this.activeFolder,
          folders: folders,
          files: files,
          type: type
        },
      });

      // Subscribing to closed event and creating a new folder if we're given a folder name.
      dialogRef.afterClosed().subscribe((result: FileObject) => {

        // Verifying user clicked rename button
        if (result) {
          // Figuring out path of file or folder.
          let path = result.path + result.name;

          // Checking if we're creating a folder or a file.
          if (result.isFolder) {

            // Making sure we append end slash.
            path += '/';

            // We're supposed to create a folder.
            this.fileService.createFolder(path).subscribe(() => {

              // Showing user some feedback.
              this.feedbackService.showInfoShort('Folder successfully created');
              this.manageAfterCreateNewFileObject.emit({ dialogResult: result, objectPath: path })
              
            }, (error: any) => this.feedbackService.showError(error));
            
          } else {
            this.manageAfterCreateNewFileObject.emit({ dialogResult: result, objectPath: path })
          }
        }
      });
    })
  }

  /**
   * Uploads one or more files to the currently active folder.
   * @callback updateFiles to actually update the files by calling updateFileObject in parent component
   */
   public uploadFiles(files: FileList) {

    // to identify the last file is uploaded
     let finished: boolean = false;
     // Iterating through each file and uploading one file at the time.
     for (let idx = 0; idx < files.length; idx++) {


      // Invoking service method responsible for actually uploading file.
      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe(() => {

        // Showing some feedback to user, and re-databinding folder's content.
        this.feedbackService.showInfo('File was successfully uploaded');
        this.fileInput = null;
        
        // check if itteration is finished:: the last index will change it to true
        idx === (files.length - 1) ? finished = true : finished = false;
      });
    };

    // wait for itteration to get finished and then invoke the parent function
    (async () => {
      while (!finished)
      await new Promise(resolve => setTimeout(resolve, 100));
      if (finished) {
        this.updateFiles.emit(this.activeFolder);
      }
    })();
  }

  /**
   * Download the active folder to the client.
   */
   public downloadActiveFolder() {

    // Ensuring we have an active folder.
    if (this.activeFolder) {

      // Downloading folder.
      this.fileService.downloadFolder(this.activeFolder);
    }
  }

  /**
   * Deletes the currently active folder.
   * @callback updateAfterDelete to update view in parent component
   */
   public deleteActiveFolder() {

    // Sanity checking to avoid deleting root folder.
    if (this.activeFolder === '/') {
      return;
    }

    // Asking user to confirm action.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      this.feedbackService.confirm('Confirm action', `Are you sure you want to delete the '${this.activeFolder}' folder?`, () => {

        // Invoking backend to actually delete folder.
        this.fileService.deleteFolder(this.activeFolder).subscribe(() => {

          this.updateAfterDelete.emit();

        }, (error: any) => this.feedbackService.showError(error));
      });
    })
  }

  /**
   * Renames the currently active folder.
   * @callback afterRenamingFolder to update view in parent component
   */
  public renameActiveFolder() {

    // Ensuring we actually have an active file.
    if (this.activeFolder === '/') {
      return;
    }
    // Opening up a modal dialog to preview file.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      const dialog = this.dialog.open(RenameFolderDialogComponent, {
        width: '550px',
        data: {
          name: this.activeFolder,
          
        },
      });
      dialog.afterClosed().subscribe((data: FileObjectName) => {
        // Checking if user wants to rename file.
        if (data) {
          // Invoking backend to rename object.
          this.fileService.rename(this.activeFolder, data.name).subscribe(() => {
            this.feedbackService.showInfo('Folder successfully renamed');
            this.afterRenamingFolder.emit({
              newName: data.name,
              oldName: this.activeFolder
            });
          }, (error: any) => this.feedbackService.showError(error));
        }
      });
    })
  }

  /**
   * Invoked when user wants to execute a macro.
   */
   public selectMacro() {

    // Opening modal dialog allowing user to select macro.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      const dialogRef = this.dialog.open(SelectMacroDialogComponent, {
        width: '550px',
        data: {
          name: '',
        },
      });

      // Subscribing to closed event and creating a new folder if we're given a folder name.
      dialogRef.afterClosed().subscribe((result: Macro) => {

        // Verifying user selected a macro.
        if (result) {

          // User selected a macro, executing it.
          this.executeMacro(result.name);
        }
      });
    })
  }

  /**
   * Executes the specified macro.
   * @param file 
   * @callback updateAfterMacro to update view in parent component
   */
  private executeMacro(file: string) {

    // Retrieving macro's arguments and description.
    this.fileService.getMacroDefinition(file).subscribe((result: MacroDefinition) => {

      /*
       * Filling out default values for anything we can intelligently figure
       * out according to selected folder.
       */
      const splits = this.activeFolder.split('/');
      if (splits.length === 4 && splits[1] === 'modules') {
        const moduleArgs = result.arguments.filter(x => x.name === 'module' || x.name === 'database');
        if (moduleArgs.length > 0) {
          for (const idx of moduleArgs) {
            idx.value = splits[2];
          }
        }
      }

      // Checking if we've got an [auth] argument, and defaulting its value to 'root'.
      const authArgs = result.arguments.filter(x => x.name === 'auth');
      if (authArgs.length > 0) {
        for (const idx of authArgs) {
          idx.value = 'root';
        }
      }

      // Opening modal dialog allowing user to select macro.
      // using ngZone to prevent the dialog from opening outside of the ngZone!
      this.ngZone.run(() => {
        const dialogRef = this.dialog.open(ExecuteMacroDialogComponent, {
          data: result,
        });

        // Subscribing to closed event and creating a new folder if we're given a folder name.
        dialogRef.afterClosed().subscribe((result: MacroDefinition) => {

          // Verifying user decorated the macro.
          if (result && result.name) {

            // User decorated macro, executing macro now by invoking backend.
            const payload = {};
            for (const idx of result.arguments.filter(x => x.value)) {
              payload[idx.name] = idx.value;
            }
            this.fileService.executeMacro(file, payload).subscribe((exeResult: Response) => {

              // Giving user some feedback.
              this.feedbackService.showInfoShort('Macro successfully executed');

              // Checking if macro changed folder or file structure in backend.
              if (exeResult.result === 'folders-changed') {

                // Asking user if he wants to refresh his folders.
                this.feedbackService.confirm(
                  'Refresh folders?',
                  'Macro execution changed your file system, do you want to refresh your files and folders?',
                  () => {

                    // Refreshing files and folder.
                    this.updateAfterMacro.emit(null);
                  });
                } else if (exeResult.result.startsWith('folders-changed|')) {
                  
                  // Macro returned specific folder that we'll need to update, and hence we can update only that folder.
                  var fileObject = exeResult.result.split('|')[1];
                  this.updateAfterMacro.emit(fileObject);
                
              }

            }, (error: any) => this.feedbackService.showError(error));

          } else if (result) {

            // Assuming user wants to select another macro.
            this.selectMacro();

          } // Else, do nothing ...
        });
      })
    }, (error: any) => this.feedbackService.showError(error));
  }

}
