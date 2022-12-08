
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
import { FileService } from 'src/app/services--/file.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { EvaluatorService } from '../../../../../_protected/services/common/evaluator.service';
import { PreviewFileDialogComponent } from '../../preview-file-dialog/preview-file-dialog.component';
import { ExecuteEndpointDialogComponent } from '../../execute-endpoint-dialog/execute-endpoint-dialog.component';
import { FileObjectName, RenameFileDialogComponent } from '../../rename-file-dialog/rename-file-dialog.component';
import { UnsavedChangesDialogComponent } from '../../unsaved-changes-dialog/unsaved-changes-dialog.component';
import { LoadSnippetDialogComponent } from 'src/app/components/misc/evaluator/load-snippet-dialog/load-snippet-dialog.component';

/**
 * File actions component for executing actions for selected file in Hyper IDE.
 */
@Component({
  selector: 'app-file-actions',
  templateUrl: './file-actions.component.html'
})
export class FileActionsComponent {

  @Input() currentFileData: any;
  @Input() openFiles: any;
  @Input() endpointData: any;
  @Output() getEndpoints: EventEmitter<any> = new EventEmitter();
  @Output() getEndpoint: EventEmitter<any> = new EventEmitter();
  @Output() insertHyperlambda: EventEmitter<string> = new EventEmitter();
  @Output() renameActiveFileFromParent: EventEmitter<any> = new EventEmitter();
  @Output() deleteActiveFileFromParent: EventEmitter<any> = new EventEmitter();
  @Output() closeFileImplFromParent: EventEmitter<any> = new EventEmitter();

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to create modal dialogs
   * @param fileService Needed to load and save files.
   * @param backendService Needed to determine access rights of user in backend
   * @param feedbackService Needed to display feedback to user
   * @param evaluatorService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   */
  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private evaluatorService: EvaluatorService) { }

  /**
   * Invoked when a file should be saved.
   * @param thenClose Boolean, only turns to true if invoked from close function.
   */
  saveActiveFile(thenClose: boolean = false) {
    if (!this.currentFileData) {
      return;
    }
    this.fileService.saveFile(this.currentFileData.path, this.currentFileData.content).subscribe({
      next: () => {
        var activeWrapper = document.querySelector('.active-codemirror-editor');
        var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
        editor.doc.markClean();
        this.feedbackService.showInfoShort('File successfully saved');
        this.getEndpoints.emit();

        // if invoked from closeActiveFile function, the recall to close after saving file.
        thenClose === true ? this.closeActiveFile(true) : '';
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns true if active file is dirty.
   */
  activeFileIsClean() {
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
   */
  executeActiveFile() {
    if (this.openFiles.length === 0 || !this.currentFileData.path.endsWith('.hl')) {
      return;
    }
    this.getEndpointData(this.currentFileData);

    if (this.endpointData) {
      this.dialog.open(ExecuteEndpointDialogComponent, {
        data: this.endpointData,
        minWidth: '80%',
      });
    } else {
      this.evaluatorService.execute(this.currentFileData.content).subscribe({
        next: () => this.feedbackService.showInfoShort('File successfully executed'),
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Returns data for endpoint by invoking parent component
   *
   * @param data current file's data
   * @returns value from the parent component based idicating if file is endpoint or not
   */
  getEndpointData(data: any){
    return this.getEndpoint.emit(data);
  }

  /**
   * Invoked when a file should be previewed.
   */
  previewActiveFile() {
    if (!this.currentFileData.path.endsWith('.md')) {
      return;
    }
    if (this.openFiles.length === 0) {
      return;
    }
    this.dialog.open(PreviewFileDialogComponent, {
      data: this.currentFileData.content,
    });
  }

  /**
   * Invoked when a file should be previewed.
   */
  insertSnippet() {
    if (!this.currentFileData.path.endsWith('.hl')) {
      return;
    }
    if (this.openFiles.length === 0) {
      return;
    }
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            return this.insertHyperlambda.emit(content);
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when a file should be renamed.
   *
   * @callback renameActiveFileFromParent to update the file inside the tree with the given name
   */
  renameActiveFile() {
    if (!this.currentFileData) {
      return;
    }
    const dialog = this.dialog.open(RenameFileDialogComponent, {
      width: '550px',
      data: {
        name: this.currentFileData.name,
      },
    });
    dialog.afterClosed().subscribe((data: FileObjectName) => {
      if (data) {
        this.fileService.rename(this.currentFileData.path, data.name).subscribe({
          next: () => this.renameActiveFileFromParent.emit(data.name),
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when a file should be deleted.
   *
   * @callback deleteActiveFileFromParent calling a function in the parent component for managing the tree
   */
  deleteActiveFile(path?: string) {
    if (!this.currentFileData && !path) {
      return;
    }
    if (!path) {
      this.feedbackService.confirm('Confirm action', 'Are you sure you want to delete currently active file?', () => {
        this.fileService.deleteFile(this.currentFileData.path).subscribe({
          next: () => this.deleteActiveFileFromParent.emit(this.currentFileData.path),
          error: (error: any) => this.feedbackService.showError(error)});
      });
    } else if (path) {
      this.fileService.deleteFile(path).subscribe({
        next: () => this.deleteActiveFileFromParent.emit(path),
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Invoked when a file should be closed.
   *
   * @param noDirtyWarnings If true user will be warned about unsaved changes
   */
  closeActiveFile(noDirtyWarnings: boolean = false) {
    if (!this.currentFileData) {
      return;
    }
    const shouldWarn = () => {
      if (noDirtyWarnings) {
        return false;
      }
      var activeWrapper = document.querySelector('.active-codemirror-editor');
      var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
      return !editor.doc.isClean();
    };
    if (!shouldWarn()) {
      this.closeFileImplFromParent.emit();
    } else {
      const dialog = this.dialog.open(UnsavedChangesDialogComponent, {
        width: '550px',
        data: this.currentFileData.name
      });
      dialog.afterClosed().subscribe((data: { save: boolean }) => {
        if (data && data.save === true) {
          this.saveActiveFile(true);

        } else if (data && data.save === false) {
          this.closeFileImplFromParent.emit();
        } else {
          return;
        }
      });
    }
  }

  /**
   * Downloads the active file or optionally the given file to the client
   *
   * @param path Optional override of which file to actually download
   */
   public downloadActiveFile(path?: string) {
    if (this.currentFileData) {
      this.fileService.downloadFile(this.currentFileData.path);
    }
    if (path) {
      this.fileService.downloadFile(path);
    }
  }
}
