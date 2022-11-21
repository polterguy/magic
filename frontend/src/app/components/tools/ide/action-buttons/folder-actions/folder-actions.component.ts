
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

// Application specific imports.
import { Response } from '../../../../../models/response.model';
import { FileService } from 'src/app/services--/file.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
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
  templateUrl: './folder-actions.component.html'
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
  fileInput: string[];
  zipFileInput: any;

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to create modal dialogs
   * @param fileService Needed to load and save files.
   * @param backendService Needed to determine user's access rights in backend
   * @param feedbackService Needed to display feedback to user
   */
  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    public backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Invoked when user wants to create a new file or folder.
   *
   * @param type to specify the type of new object: file | folder
   */
  createNewFileObject(type: string) {
    const folders = this.getFolders;
    const files = this.getFiles;
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
    dialogRef.afterClosed().subscribe((result: FileObject) => {
      if (result) {
        let path = result.path + result.name;
        if (result.isFolder) {
          path += '/';
          this.fileService.createFolder(path).subscribe({
            next: () => {
              this.feedbackService.showInfoShort('Folder successfully created');
              this.manageAfterCreateNewFileObject.emit({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.feedbackService.showError(error)});
        } else {
          this.fileService.saveFile(path, '').subscribe({
            next: () => {
              this.feedbackService.showInfoShort('File successfully created');
              this.manageAfterCreateNewFileObject.emit({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.feedbackService.showError(error)});
        }
      }
    });
  }

  /**
   * Uploads one or more files to the currently active folder.
   *
   * @param files List of files to upload
   */
  uploadFiles(files: FileList) {
    for (let idx = 0; idx < files.length; idx++) {
      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe({
        next: () => {
          this.feedbackService.showInfo('File was successfully uploaded');
          this.fileInput = null;
          if (idx === (files.length - 1)){
            this.updateFiles.emit(this.activeFolder);
          }
        },
        error: (error: any) => this.feedbackService.showError(error)});
    };
  }

  /**
   * Download the active folder to the client.
   */
   downloadActiveFolder() {
    if (this.activeFolder) {
      this.fileService.downloadFolder(this.activeFolder);
    }
  }

  /**
   * Deletes the currently active folder.
   */
  deleteActiveFolder() {
    if (this.activeFolder === '/') {
      return;
    }
    this.feedbackService.confirm('Confirm action', `Are you sure you want to delete the '${this.activeFolder}' folder?`, () => {
      this.fileService.deleteFolder(this.activeFolder).subscribe({
        next: () => this.updateAfterDelete.emit(),
        error: (error: any) => this.feedbackService.showError(error)});
    });
  }

  /**
   * Renames the currently active folder.
   */
  renameActiveFolder() {
    if (this.activeFolder === '/') {
      return;
    }
    const dialog = this.dialog.open(RenameFolderDialogComponent, {
      width: '550px',
      data: {
        name: this.activeFolder,

      },
    });
    dialog.afterClosed().subscribe((data: FileObjectName) => {
      if (data) {
        this.fileService.rename(this.activeFolder, data.name).subscribe({
          next: () => {
            this.feedbackService.showInfo('Folder successfully renamed');
            this.afterRenamingFolder.emit({
              newName: data.name,
              oldName: this.activeFolder
            });
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when user wants to execute a macro.
   */
   selectMacro() {
    const dialogRef = this.dialog.open(SelectMacroDialogComponent, {
      width: '550px',
      data: {
        name: '',
      },
    });
    dialogRef.afterClosed().subscribe((result: Macro) => {
      if (result) {
        this.executeMacro(result.name);
      }
    });
  }

  /*
   * Executes the specified macro.
   */
  private executeMacro(file: string) {
    this.fileService.getMacroDefinition(file).subscribe({
      next: (result: MacroDefinition) => {

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
        const authArgs = result.arguments.filter(x => x.name === 'auth');
        if (authArgs.length > 0) {
          for (const idx of authArgs) {
            idx.value = 'root';
          }
        }
        const dialogRef = this.dialog.open(ExecuteMacroDialogComponent, {
          data: result,
        });
        dialogRef.afterClosed().subscribe((result: MacroDefinition) => {
          if (result && result.name) {
            const payload = {};
            for (const idx of result.arguments.filter(x => x.value)) {
              payload[idx.name] = idx.value;
            }
            this.fileService.executeMacro(file, payload).subscribe({
              next: (exeResult: Response) => {
                this.feedbackService.showInfoShort('Macro successfully executed');
                if (exeResult.result === 'folders-changed') {
                  this.feedbackService.confirm(
                    'Refresh folders?',
                    'Macro execution changed your file system, do you want to refresh your files and folders?',
                    () => {
                      this.updateAfterMacro.emit(null);
                    });
                  } else if (exeResult.result.startsWith('folders-changed|')) {
                    var fileObject = exeResult.result.split('|')[1];
                    this.updateAfterMacro.emit(fileObject);

                }
              },
              error: (error: any) => this.feedbackService.showError(error)});
          } else if (result) {
            this.selectMacro();
          }
        });
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
