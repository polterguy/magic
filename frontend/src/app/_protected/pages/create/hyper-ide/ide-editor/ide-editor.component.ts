
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ExecuteMacroDialogComponent } from '../components/execute-macro-dialog/execute-macro-dialog.component';
import { PreviewFileDialogComponent } from '../components/preview-file-dialog/preview-file-dialog.component';
import { RenameFileDialogComponent, FileObjectName } from '../components/rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent, Macro } from '../components/select-macro-dialog/select-macro-dialog.component';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { EvaluatorService } from '../../../../../_general/services/evaluator.service';
import { EndpointDialogComponent } from '../../../../../_general/components/endpoint-dialog/endpoint-dialog.component';
import { FileNode } from '../_models/file-node.model';
import { MacroDefinition } from '../_models/macro-definition.model';
import { TreeNode } from '../_models/tree-node.model';
import { CodemirrorActionsService } from '../_services/codemirror-actions.service';
import { FileService } from '../_services/file.service';
import { VocabularyService } from '../_services/vocabulary.service';
import { Endpoint } from 'src/app/_protected/models/common/endpoint.model';

@Component({
  selector: 'app-ide-editor',
  templateUrl: './ide-editor.component.html',
  styleUrls: ['./ide-editor.component.scss']
})
export class IdeEditorComponent implements OnInit, OnDestroy, OnChanges {

  @Input() currentFileData: FileNode;
  @Input() activeFolder: string = '';
  @Input() openFiles: FileNode[];
  @Input() endpoints: Endpoint[];

  @Output() updateFileObject: EventEmitter<any> = new EventEmitter<any>();
  @Output() getFilesFromServer: EventEmitter<any> = new EventEmitter<any>();
  @Output() getEndpoints: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataBindTree: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeFileImpl: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteActiveFolderFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteActiveFileFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() renameActiveFileFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() renameActiveFolderFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() createNewFileObjectFromParent: EventEmitter<any> = new EventEmitter<any>();

  private codemirrorActionSubscription!: Subscription;

  private codemirrorOptions: any = {};

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private fileService: FileService,
    private generalService: GeneralService,
    private evaluatorService: EvaluatorService,
    private vocabularyService: VocabularyService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.watchForActions();
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);

    if (changes['currentFileData'] && !changes['currentFileData'].firstChange) {
      if (this.currentFileData) {
        if (this.currentFileData.options !== this.codemirrorOptions[this.currentFileData.path]) {
          this.getCodeMirrorOptions();
          setTimeout(() => {
            const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
            const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
            editor.doc.isClean()
            editor.doc.markClean();
            editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
          }, 100);
        }
      }
    }
  }

  private async getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, this.currentFileData?.path.split('.').pop()).then((options: any) => {
      this.codemirrorOptions[this.currentFileData.path] = options;
      this.currentFileData.options = options;
    });
  }

  clearEditorHistory(clear: boolean) {
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
    editor.doc.markClean();
    editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
  }

  /**
   * Implementation of AfterViewInit.
   *
   * This is needed to ensure we retrieve Hyperlambda vocabulary from backend to
   * have autocomplete data for Hyperlambda language.
   */
  ngAfterViewInit() {
    if (!window['_vocabulary']) {
      this.vocabularyService.vocabulary().subscribe({
        next: (vocabulary: string[]) => window['_vocabulary'] = vocabulary,
        error: error => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }
  }

  /**
   * Invoked when a file should be saved.
   * @param thenClose Boolean, only turns to true if invoked from close function.
   */
  private saveActiveFile(thenClose: boolean = false) {
    this.fileService.saveFile(this.currentFileData.path, this.currentFileData.content).subscribe({
      next: () => {
        this.markEditorClean();
        this.generalService.showFeedback('File successfully saved', 'successMessage');
        this.getEndpoints.emit();
        // if invoked from closeActiveFile function, the recall to close after saving file.
        thenClose === true ? this.closeActiveFile(true) : '';
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Invoked when a file should be deleted.
   *
   * @callback deleteActiveFileFromParent calling a function in the parent component for managing the tree
   */
  private deleteActiveFile() {
    const file: any = {
      name: this.currentFileData.name,
      node: {
        path: this.currentFileData.path
      }
    }
    this.deleteActiveFileFromParent.emit(file);
  }

  /**
   * Invoked when a folder should be deleted.
   *
   * @callback deleteActiveFolderFromParent calling a function in the parent component for managing the tree
   */
  private deleteActiveFolder() {
    this.deleteActiveFolderFromParent.emit(this.currentFileData.folder);
  }

  /**
   * Invoked when a file should be closed.
   *
   * @param noDirtyWarnings If true user will be warned about unsaved changes
   */
  private async closeActiveFile(noDirtyWarnings: boolean = false) {
    if (!this.currentFileData) {
      return;
    }
    await this.activeFileIsClean().then((res: boolean) => {
      if (res === true) {
        this.closeFileImpl.emit();
      } else {
        const dialog = this.dialog.open(UnsavedChangesDialogComponent, {
          width: '550px',
          data: this.currentFileData.name
        });
        dialog.afterClosed().subscribe((data: { save: boolean }) => {
          if (data && data.save === true) {
            this.saveActiveFile(true);
          } else if (data && data.save === false) {
            this.markEditorClean();
            this.closeFileImpl.emit();
            this.setFocusToActiveEditor();
          } else {
            return;
          }
        });
      }
    })
  }

  /**
   * Invoked when a Hyperlambda file should be executed.
   *
   * How the file is executed depends upon if the file is an endpoint file or not.
   * If the file is an endpoint file, a modal dialog will be displayed, allowing
   * the user to parametrise invocation as an HTTP request first.
   */
  private async executeActiveFile() {
    if (this.openFiles.length === 0 || !this.currentFileData.path.endsWith('.hl')) {
      return;
    }

    if (await this.getEndpointToExecute() !== null) {
      this.dialog.open(EndpointDialogComponent, {
        data: { itemToBeTried: await this.getEndpointToExecute() },
        minWidth: '80vw',
        minHeight: '50vh',
        panelClass: ['light']
      });
    } else {
      this.evaluatorService.execute(this.currentFileData.content).subscribe({
        next: () => this.generalService.showFeedback('File successfully executed', 'successMessage'),
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'erroorMessage', 'Ok', 5000)
      });
    }
  }

  /*
   * Returns an endpoint matching the specified file node, or null if file cannot
   * be matched to an endpoint.
   */
  private getEndpointToExecute(): Promise<any> {
    if (this.currentFileData?.path?.startsWith('/modules/') || this.currentFileData?.path?.startsWith('/system/')) {
      const lastSplits = this.currentFileData.name.split('.');
      if (lastSplits.length >= 3 && lastSplits[lastSplits.length - 1] === 'hl') {
        switch (lastSplits[lastSplits.length - 2]) {
          case 'get':
          case 'put':
          case 'post':
          case 'patch':
          case 'delete':

            /*
             * File is probably a Hyperlambda endpoint, however to be sure we
             * verify we can find file in our list of endpoints.
             */
            const url = 'magic' + this.currentFileData.folder + lastSplits[0];
            // deep copying the original endpoints array to prevent manipulations.
            const copyEndpoints = JSON.parse(JSON.stringify(this.endpoints));
            let endpoints = copyEndpoints.filter((x: any) => x.path === url && x.verb === lastSplits[lastSplits.length - 2]);

            if (endpoints.length > 0) {
              return endpoints[0];
            }
        }
      }
    }
    return null;
  }

  /**
   * Returns true if active file is dirty.
   */
  private activeFileIsClean() {
    return new Promise((resolve) => {
      const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
      const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
      if (activeWrapper) {
        const editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
        if (editor) {
          resolve(editor.isClean())
        }
      }
      resolve(true);
    })
  }

  private markEditorClean() {
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
    editor.doc.markClean();
    editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
  }

  /**
   * Invoked when a file should be renamed.
   *
   * @callback renameActiveFileFromParent to update the file inside the tree with the given name
   */
  private renameActiveFile() {
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
        this.renameActiveFileFromParent.emit({ file: this.currentFileData, name: data.name });
        this.currentFileData.name = data.name;
        this.currentFileData.path = this.currentFileData.path.substring(0, this.currentFileData.path.lastIndexOf('/') + 1) +
          data.name;
      }
    });
  }
  /**
   * Invoked when a file should be renamed.
   *
   * @callback renameActiveFolderFromParent to update the file inside the tree with the given name
   */
  private renameActiveFolder() {
    if (!this.currentFileData) {
      return;
    }
    const dialog = this.dialog.open(RenameFolderDialogComponent, {
      width: '550px',
      data: {
        name: this.activeFolder
      },
    });
    dialog.afterClosed().subscribe((data: string) => {
      if (data) {
        const path: string = this.activeFolder.substring(0, this.activeFolder.lastIndexOf('/'));
        const folder: any = {
          newName: data,
          name: path.split('/').pop(),
          node: {
            path: this.activeFolder
          }
        }
        this.renameActiveFolderFromParent.emit(folder);
        this.updateFileObject.emit(folder);
        this.activeFolder = this.activeFolder.substring(0, this.activeFolder.substring(0, this.activeFolder.length - 1).lastIndexOf('/') + 1) + data + '/';
      }
    });
  }

  private createNewFileObject(type: string) {
    this.createNewFileObjectFromParent.emit(type);
  }

  /**
   * Invoked when a file should be previewed.
   */
  private previewActiveFile() {
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
  private insertSnippet() {
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
            return this.insertHyperlambda(content);
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  private insertHyperlambda(content: string) {
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    if (activeWrapper) {
      var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
      if (editor) {
        let result = '';
        const indentation = editor.doc.sel.ranges[0].anchor.ch;
        if (indentation % 3 !== 0) {
          this.generalService.showFeedback('Indentation must be modulo of 3', 'errorMessage', 'Ok', 5000);
          return;
        }
        const lines = content.trimEnd().split('\n');
        let first = true;
        for (let idx of lines) {
          if (first) {
            result += idx.trimEnd() + '\r\n';
            first = false;
          } else {
            result += ' '.repeat(indentation) + idx.trimEnd() + '\r\n';
          }
        }
        const doc = editor.getDoc();
        const cursor = doc.getCursor();
        const line = doc.getLine(cursor.line);
        const pos = {
          line: cursor.line,
          ch: line.length,
        };
        doc.replaceRange(result, pos);
      }
    }
  }

  /**
   * Invoked when user wants to execute a macro.
   */
  private selectMacro() {
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
          width: '500px',
          data: result,
        });
        dialogRef.afterClosed().subscribe((result: MacroDefinition) => {
          if (result && result.name) {
            const payload = {};
            for (const idx of result.arguments.filter(x => x.value)) {
              payload[idx.name] = idx.value;
            }
            this.fileService.executeMacro(file, payload).subscribe({
              next: (exeResult: any) => {
                this.generalService.showFeedback('Macro successfully executed', 'successMessage');
                if (exeResult.result === 'folders-changed') {

                  this.dialog.open(ConfirmationDialogComponent, {
                    width: '500px',
                    data: {
                      title: `Refresh folders`,
                      description_extra: 'Macro execution changed your file system, do you want to refresh your files and folders?',
                      action_btn: 'Refresh',
                      action_btn_color: 'primary',
                      bold_description: true
                    }
                  }).afterClosed().subscribe((result: string) => {
                    if (result === 'confirm') {
                      this.getFilesFromServer.emit();
                    }
                  })
                } else if (exeResult.result.startsWith('folders-changed|')) {
                  var fileObject = exeResult.result.split('|')[1];
                  this.updateFileObject.emit(fileObject);

                }
              },
              error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            });
          } else if (result) {
            this.selectMacro();
          }
        });
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /*
   * Sets focus to active editor.
   */
  public setFocusToActiveEditor() {
    setTimeout(() => {
      const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
      const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
      if (activeWrapper) {
        var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
        if (editor) {
          editor.focus();
        }
      }
    }, 1);
  }

  public openShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['full']
      }
    })
  }

  private watchForActions() {
    this.codemirrorActionSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {
        case 'save':
          this.saveActiveFile();
          break;

        case 'deleteFile':
          this.deleteActiveFile();
          break;

        case 'close':
          this.closeActiveFile();
          break;

        case 'renameFile':
          this.renameActiveFile();
          break;

        case 'renameFolder':
          this.renameActiveFolder();
          break;

        case 'insertSnippet':
          this.insertSnippet();
          break;

        case 'macro':
          this.selectMacro();
          break;

        case 'newFile':
          this.createNewFileObject('file');
          break;

        case 'newFolder':
          this.createNewFileObject('folder');
          break;

        case 'deleteFolder':
          this.deleteActiveFolder();
          break;

        case 'preview':
          this.previewActiveFile();
          break;

        case 'execute':
          this.executeActiveFile();
          break;

        default:
          break;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.codemirrorActionSubscription) {
      this.codemirrorActionSubscription.unsubscribe();
    }
  }
}

/**
* Root tree node pointing to root folder.
*/
const root: TreeNode = {
  name: '/',
  path: '/',
  isFolder: true,
  children: [],
  level: 0,
};
