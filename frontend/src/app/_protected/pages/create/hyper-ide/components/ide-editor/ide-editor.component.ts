
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ExecuteMacroDialogComponent } from '../execute-macro-dialog/execute-macro-dialog.component';
import { PreviewFileDialogComponent } from '../preview-file-dialog/preview-file-dialog.component';
import { RenameFileDialogComponent, FileObjectName } from '../rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent, Macro } from '../select-macro-dialog/select-macro-dialog.component';
import { UnsavedChangesDialogComponent } from '../unsaved-changes-dialog/unsaved-changes-dialog.component';
import { EvaluatorService } from '../../../../../../_general/services/evaluator.service';
import { ExecuteEndpointDialogComponent } from '../../../../../../_general/components/execute-endpoint-dialog/execute-endpoint-dialog.component';
import { FileNode } from '../../models/file-node.model';
import { MacroDefinition } from '../../models/macro-definition.model';
import { CodemirrorActionsService } from '../../services/codemirror-actions.service';
import { FileService } from '../../services/file.service';
import { VocabularyService } from '../../services/vocabulary.service';
import { Endpoint } from 'src/app/_protected/models/common/endpoint.model';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { BazarService } from 'src/app/_general/services/bazar.service';
import { MessageService } from 'src/app/_general/services/message.service';

/**
 * Hyper IDE editor component, wrapping currently open files, allowing user to edit the code.
 */
@Component({
  selector: 'app-ide-editor',
  templateUrl: './ide-editor.component.html',
  styleUrls: ['./ide-editor.component.scss']
})
export class IdeEditorComponent implements OnInit, OnDestroy, OnChanges {

  private codemirrorActionSubscription!: Subscription;
  private codemirrorOptions: any = {};

  @Input() currentFileData: FileNode;
  @Input() activeFolder: string = '';
  @Input() openFiles: FileNode[];
  @Input() endpoints: Endpoint[];

  @Output() updateFileObject: EventEmitter<any> = new EventEmitter<any>();
  @Output() getFilesFromServer: EventEmitter<any> = new EventEmitter<any>();
  @Output() getEndpoints: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataBindTree: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeFile: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteActiveFolderFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteActiveFileFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() renameFileFromParent: EventEmitter<{ file: { path: string }, newName: string }> = new EventEmitter<{ file: { path: string }, newName: string }>();
  @Output() renameFolderFromParent: EventEmitter<any> = new EventEmitter<any>();
  @Output() createNewFileObjectFromParent: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private bazarService: BazarService,
    private generalService: GeneralService,
    private messageService: MessageService,
    private evaluatorService: EvaluatorService,
    private vocabularyService: VocabularyService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    this.watchForActions();
  }

  ngOnChanges(changes: SimpleChanges) {

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

  clearEditorHistory() {

    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
    editor.doc.markClean();
    editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
  }

  fileType() {

    return this.currentFileData?.path.substring(this.currentFileData?.path.lastIndexOf('.') + 1);
  }

  insertFromOpenAI(snippet: string) {

    this.currentFileData.content = snippet;
  }

  setFocusToActiveEditor() {

    setTimeout(() => {
      const fileExisting: number = this.openFiles.findIndex((item: FileNode) => item.path === this.currentFileData.path);
      const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
      if (activeWrapper) {
        var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
        if (editor) {
          editor.focus();
        }
      }
    }, 1);
  }

  openShortkeys() {

    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['full', 'prompt']
      }
    })
  }

  ngAfterViewInit() {

    if (!window['_vocabulary']) {
      this.vocabularyService.vocabulary().subscribe({
        next: (vocabulary: string[]) => window['_vocabulary'] = vocabulary,
        error: error => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }
  }

  ngOnDestroy() {

    this.codemirrorActionSubscription?.unsubscribe();
  }

  /*
   * Private helper methods.
   */

  private saveActiveFile(thenClose: boolean = false) {

    this.fileService.saveFile(this.currentFileData.path, this.currentFileData.content).subscribe({
      next: () => {

        this.markEditorClean(false);
        this.generalService.showFeedback('File successfully saved', 'successMessage');
        this.getEndpoints.emit();
        if (thenClose) {
          this.closeActiveFile(true);
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private deleteActiveFile() {

    this.deleteActiveFileFromParent.emit();
  }

  private deleteActiveFolder() {

    this.deleteActiveFolderFromParent.emit(this.currentFileData.folder);
  }

  private async closeActiveFile(noDirtyWarnings: boolean = false) {

    if (!this.currentFileData) {
      return;
    }
    await this.activeFileIsClean().then((res: boolean) => {
      if (res === true) {
        this.closeFile.emit(this.currentFileData.path);
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
            this.closeFile.emit(this.currentFileData.path);
            this.setFocusToActiveEditor();
          } else {
            return;
          }
        });
      }
    })
  }

  private async executeActiveFile() {

    if (this.openFiles.length === 0 || !this.currentFileData.path.endsWith('.hl')) {
      return;
    }

    if (await this.getEndpointToExecute() !== null) {
      this.dialog.open(ExecuteEndpointDialogComponent, {
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

  private markEditorClean(clearHistory: boolean = true) {
    
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
    editor.doc.markClean();
    if (clearHistory) {
      editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
    }
  }

  private renameFile() {

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
        this.renameFileFromParent.emit({ file: this.currentFileData, newName: data.name });
      }
    });
  }

  private renameFolder() {

    if (!this.currentFileData) {
      return;
    }
    if (this.activeFolder === '/' || this.activeFolder === '/system/' || this.activeFolder === '/modules/') {
      this.generalService.showFeedback('You cannot rename system folders', 'errorMessage', 'Ok', 3000);
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
        this.renameFolderFromParent.emit({
          folder: this.activeFolder,
          newName: data,
        });
        this.activeFolder = this.activeFolder.substring(0, this.activeFolder.substring(0, this.activeFolder.length - 1).lastIndexOf('/') + 1) + data + '/';
      }
    });
  }

  private createNewFileObject(type: string) {

    this.createNewFileObjectFromParent.emit(type);
  }

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
          this.renameFile();
          break;

        case 'renameFolder':
          this.renameFolder();
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

        case 'prompt':
          this.prompt();
          break;

        default:
          break;
      }
    })
  }

  private prompt() {

    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
    const selection = editor.getSelection();
    let prompt = '';
    const words = this.vocabularyService.words.filter(x => x === selection);
    if (words.length > 0) {
      prompt = 'How does [' + selection + '] work?';
    } else {
      prompt = 'Explain this Hyperlambda code\r\n\r\n' + selection;
    }

    this.generalService.showLoading();
    this.recaptchaV3Service.execute('subscriptionFormSubmission').subscribe({
      next: (token: string) => {

        this.bazarService.prompt(prompt, token).subscribe({
          next: (result: any) => {

            this.generalService.hideLoading();
            const completion = result.result;
            this.messageService.sendMessage({
              name: 'magic.show-help',
              content: completion,
            });
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Could not invoke magic API server to create completion', 'errorMessage');
          }
        });
      },
      error: () => {

        this.generalService.hideLoading();
      },
    });
  }

  private getCodeMirrorOptions() {

    const options = this.codemirrorActionsService.getActions(null, this.currentFileData?.path.split('.').pop());
    this.codemirrorOptions[this.currentFileData.path] = options;
    this.currentFileData.options = options;
  }
}
