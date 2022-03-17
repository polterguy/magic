
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output
} from '@angular/core';

// Application specific imports.
import { AuthService } from 'src/app/services/auth.service';
import { FileService } from 'src/app/services/tools/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EvaluatorService } from '../../../evaluator/services/evaluator.service';
import { PreviewFileDialogComponent } from '../../preview-file-dialog/preview-file-dialog.component';
import { ExecuteEndpointDialogComponent } from '../../execute-endpoint-dialog/execute-endpoint-dialog.component';
import { FileObjectName, RenameFileDialogComponent } from '../../rename-file-dialog/rename-file-dialog.component';
import { BackendService } from 'src/app/services/backend.service';

/**
 * File actions component for executing actions for selected file in Hyper IDE.
 */
@Component({
  selector: 'app-file-actions',
  templateUrl: './file-actions.component.html',
  styleUrls: ['./file-actions.component.scss']
})
export class FileActionsComponent implements OnInit {

  @Input() currentFileData: any;
  @Input() openFiles: any;
  @Input() endpointData: any;
  @Output() getEndpoints: EventEmitter<any> = new EventEmitter();
  @Output() getEndpoint: EventEmitter<any> = new EventEmitter();
  @Output() renameActiveFileFromParent: EventEmitter<any> = new EventEmitter();
  @Output() deleteActiveFileFromParent: EventEmitter<any> = new EventEmitter();
  @Output() closeFileImplFromParent: EventEmitter<any> = new EventEmitter();

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogs
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param evaluatorService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   * @param ngZone Needed to make sure dialogs popup inside the ngZone
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private fileService: FileService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private evaluatorService: EvaluatorService,
    readonly ngZone: NgZone
  ) { }

  ngOnInit(): void {
  }

  /**
   * Invoked when a file should be saved.
   * 
   * @param file File to save
   */
   public saveActiveFile() {

    // Ensuring we actually have open files.
    if (!this.currentFileData) {
      return;
    }

    // Saving file by invoking backend.
    this.fileService.saveFile(this.currentFileData.path, this.currentFileData.content).subscribe(() => {

      // Marking document as clean.
      var activeWrapper = document.querySelector('.active-codemirror-editor');
      var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
      editor.doc.markClean();

      // Providing feedback to user.
      this.feedbackService.showInfoShort('File successfully saved');

      // We'll need to re-retrieve endpoints now, to allow for executing file correctly.
      this.getEndpoints.emit();

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if active file is dirty.
   */
   public activeFileIsClean() {

    // Retrieving active CodeMirror editor to check if its document is dirty or not.
    var activeWrapper = document.querySelector('.active-codemirror-editor');
    if (activeWrapper) {
      var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
      if (editor) {
        return editor.isClean();
      }
    }
    return true;
  }

  /**
   * Invoked when a Hyperlambda file should be executed.
   * 
   * How the file is executed depends upon if the file is an endpoint file or not.
   * If the file is an endpoint file, a modal dialog will be displayed, allowing
   * the user to parametrise invocation as an HTTP request first.
   * 
   * @param file File node wrapping file to execute
   */
   public executeActiveFile() {

    // Ensuring we actually have open files.
    if (this.openFiles.length === 0 || !this.currentFileData.path.endsWith('.hl')) {
      return;
    }
    
    // Figuring out if file is an endpoint file or not.
    this.getEndpointData(this.currentFileData);
    
    if (this.endpointData) {
      // Opening up dialog to allow user to invoke endpoint.
      // using ngZone to prevent the dialog from opening outside of the ngZone!
      this.ngZone.run(() => {
        this.dialog.open(ExecuteEndpointDialogComponent, {
          data: this.endpointData,
          minWidth: '80%',
        });
      })
    } else {

      // Executing file directly as a Hyperlambda file.
      this.evaluatorService.execute(this.currentFileData.content).subscribe(() => {

        // Providing feedback to user.
        this.feedbackService.showInfoShort('File successfully executed');

      }, (error: any) => this.feedbackService.showError(error));
    }
  }

  /**
   * 
   * @param data current file's data
   * @returns value from the parent component based on the given file
   * to check if the given file is an endpoint or not
   */
  public getEndpointData(data: any){
    return this.getEndpoint.emit(data);
  }

  /**
   * Invoked when a file should be previewed.
   * 
   * @param file File to preview
   */
   public previewActiveFile() {

    // Making sure file can be previewed.
    if (!this.currentFileData.path.endsWith('.md')) {
      return;
    }

    // Ensuring we actually have open files.
    if (this.openFiles.length === 0) {
      return;
    }

    // Opening up a modal dialog to preview file.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      this.dialog.open(PreviewFileDialogComponent, {
        data: this.currentFileData.content,
      });
    })
  }

  /**
   * Invoked when a file should be renamed.
   * 
   * @param file File to rename
   * @callback renameActiveFileFromParent to update the file inside the tree
   * the given name will be emitted to the parent function
   */
   public renameActiveFile() {

    // Ensuring we actually have an active file.
    if (!this.currentFileData) {
      return;
    }
    // Opening up a modal dialog to preview file.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      const dialog = this.dialog.open(RenameFileDialogComponent, {
        width: '550px',
        data: {
          name: this.currentFileData.name,
        },
      });
      dialog.afterClosed().subscribe((data: FileObjectName) => {
        // Checking if user wants to rename file.
        if (data) {
          // Invoking backend to rename object.
          this.fileService.rename(this.currentFileData.path, data.name).subscribe(() => {
            this.renameActiveFileFromParent.emit(data.name)
          }, (error: any) => this.feedbackService.showError(error));
        }
      });
    })
  }

  /**
   * Invoked when a file should be deleted.
   * 
   * @callback deleteActiveFileFromParent calling a function in the parent component for managing the tree
   */
   public deleteActiveFile(path?: string) {

    // Ensuring we actually have open files.
    if (!this.currentFileData && !path) {
      return;
    }
    
    if (!path) {
      // Asking user to confirm action.
      // using ngZone to prevent the dialog from opening outside of the ngZone!
      this.ngZone.run(() => {
        this.feedbackService.confirm('Confirm action', 'Are you sure you want to delete currently active file?', () => {
          // Deleting file by invoking backend.
          this.fileService.deleteFile(this.currentFileData.path).subscribe(() => {
            // calling parent function to decide what to do with the tree
            this.deleteActiveFileFromParent.emit(this.currentFileData.path);
          }, (error: any) => this.feedbackService.showError(error));
        });
      })
    } else if (path) {
      this.fileService.deleteFile(path).subscribe(() => {
        // calling parent function to decide what to do with the tree
        this.deleteActiveFileFromParent.emit(path);
      }, (error: any) => this.feedbackService.showError(error));
    }
  }

  /**
   * Invoked when a file should be closed.
   * 
   * @param noDirtyWarnings If true user will be warned about unsaved changes
   * @callback closeFileImplFromParent closing function in parent component to actually close the file
   */
   public closeActiveFile(noDirtyWarnings: boolean = false) {

    // Ensuring we actually have open files.
    if (!this.currentFileData) {
      return;
    }

    // Checking if content is dirty.
    const shouldWarn = () => {
      if (noDirtyWarnings) {
        return false;
      }
      var activeWrapper = document.querySelector('.active-codemirror-editor');
      var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
      return !editor.doc.isClean();
    };
    if (!shouldWarn()) {

      // File has not been edited and we can close editor immediately.
      this.closeFileImplFromParent.emit();

    } else {

      // File has been edited, and we need to inform user allowing him to save it.
      // using ngZone to prevent the dialog from opening outside of the ngZone!
      this.ngZone.run(() => {
        this.feedbackService.confirm('File not saved', 'File has unsaved changes, are you sure you want to close the file?', () => {

          // User confirmed he wants to close file, even though the editor is dirty (has changes).
          this.closeFileImplFromParent.emit();
        });
      })
    }
  }

  /**
   * Downloads the active file to the client
   */
   public downloadActiveFile(path?: string) {

    // Making sure a file is selected
    if (this.currentFileData) {

      // Downloading file.
      this.fileService.downloadFile(this.currentFileData.path);
    } 
    if (path) {

      // Downloading file.
      this.fileService.downloadFile(path);
    }
  }
}
