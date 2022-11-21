
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

// Application specific imports.
import { Response } from '../../../models/response.model';
import { FlatNode } from './models/flat-node.model';
import { FileNode } from './models/file-node.model';
import { TreeNode } from './models/tree-node.model';
import { Message } from '../../../models/message.model';
import { VocabularyService } from '../services/vocabulary.service';
import { MessageService } from '../../../services--/message.service';
import { FeedbackService } from '../../../services--/feedback.service';
import { Endpoint } from '../../../_protected/pages/administration/generated-endpoints/_models/endpoint.model';
import { EndpointService } from '../../../_protected/pages/generated-endpoints/_services/endpoint.service';
import { FileService } from 'src/app/services--/file.service';
import { FileActionsComponent } from './action-buttons/file-actions/file-actions.component';
import { FolderActionsComponent } from './action-buttons/folder-actions/folder-actions.component';
import { IncompatibleFileDialogComponent } from './incompatible-file-dialog/incompatible-file-dialog.component';

// File types extensions.
import fileTypes from 'src/app/codemirror/file-types.json';
import { WarningComponent } from './warning/warning.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

/**
 * IDE component for editing code.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdeComponent implements OnInit, OnDestroy {

  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.largeScreen = this.getScreenWidth >= this.smallScreenSize ? true : false;
  }

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  // Model describing endpoints in your installation.
  private endpoints: Endpoint[];

  // Subscription allowing us to subscribe to messages relevant for component.
  private subscription: Subscription;

  // Transforms from internal data structure to tree control's expectations.
  private _transformer = (node: TreeNode, level: number) => {
    return {
      expandable: node.isFolder,
      name: node.name,
      level: level,
      node: node,
    };
  };

  // Flattens tree structure.
  private treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);

  @ViewChild(FileActionsComponent) fileActionsComponent: FileActionsComponent;
  @ViewChild(FolderActionsComponent) folderActionsComponent: FolderActionsComponent;
  @ViewChild('drawer') drawer: MatSidenav;

  /**
   * To get the width of the screen
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * largeScreen {boolean} :: to check whether the screen width is small or large
   */
  getScreenWidth: number;
  smallScreenSize: number = 768;
  largeScreen: boolean = undefined;

  /**
   * Root tree node pointing to root folder.
   */
  root: TreeNode = {
    name: '/',
    path: '/',
    isFolder: true,
    children: [],
    level: 0,
  };

  /**
   * Actual tree control for component.
   */
  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);

  /**
   * Actual data source for tree control.
   */
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  /**
   * To start resizing the mat-drawer section
   * preventing from miscalculation of the width, as mentioned inside material docs
   */
  startResizing: boolean = false;

  /**
   * Currently edited files.
   */
  openFiles: FileNode[] = [];

  /**
   * Currently open folder
   */
  openFolder: any;

  /**
   * Currently selected file.
   */
  currentFileData: FileNode;

  /**
   * Currently active folder, which is dependent upon file selected, etc.
   */
  activeFolder: string = '/';

  /**
  * Current folder we're viewing contens of.
  */
  currentFolder = '/';

  /**
   * boolean:: system files sliding value
   * if true, all files will be displayed
   * default value is false.
   */
  systemFiles: boolean = false;

  /**
   * Creates an instance of your component.
   *
   * @param cdRef Needed to mark component as having changes
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param vocabularyService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   * @param messageService Service used to publish messages to other components in the system
   * @param endpointService Needed to retrieve endpoints from backend
   * @param ngZone Needed to be able to run CodeMirror callbacks within the context of Angular
   * @param dialog Needed to create modal dialogs
   */
  constructor(
    private cdRef: ChangeDetectorRef,
    private fileService: FileService,
    private feedbackService: FeedbackService,
    private vocabularyService: VocabularyService,
    private messageService: MessageService,
    private endpointService: EndpointService,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.onWindowResize();
    this.getFilesFromServer('/', () => {

      // This is necessary to determine if Hyperlambda files should be executed or invoked.
      this.getEndpoints();
    });
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'magic.folders.update') {
        this.updateFileObject(msg.content);

        /*
         * If folder that was updated was a folder that could in theory contain endpoints,
         * we retrieve endpoints from server again.
         */
        switch (msg.content) {
          case '/modules/':
          case '/system/':
            this.getEndpoints();
            break;
        }

      } else if (msg.name === 'magic.crudifier.frontend-generated-locally') {
        this.updateFileObject('/etc/');
        this.feedbackService.showInfo('Frontend was generated and saved to your \'/etc/frontends/\' folder')
      }
    });
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
        error: error => this.feedbackService.showError(error)});
    }
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  /**
   * Returns true if specified node has children.
   */
  isExpandable(_: number, node: FlatNode) {
    return node.expandable;
  }

  /**
   * Invoked when user wants to open a file.
   *
   * @param file Tree node wrapping file to open
   */
  openFile(file: TreeNode) {
    if (this.openFiles.filter(x => x.path === file.path).length > 0) {
      this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
      this.setFocusToActiveEditor();
    } else {
      if (this.getCodeMirrorOptions(file.path) === null){
        const dialog = this.dialog.open(IncompatibleFileDialogComponent, {
          width: '550px',
          data: {
            name: file.name,
          },
        });
        dialog.afterClosed().subscribe((data: { deleteFile: false, download: false, unzip: false }) => {
          if (data && data.download) {
            this.fileActionsComponent.downloadActiveFile(file.path)
          } else if (data && data.deleteFile) {
            this.fileActionsComponent.deleteActiveFile(file.path)
          } else if (data && data.unzip) {
            this.fileService.unzip(file.path).subscribe({
              next: () => {
                const update = file.path.substring(0, file.path.lastIndexOf('/') + 1);
                this.updateFileObject(update);
              },
              error: (error: any) => this.feedbackService.showError(error)
            });
          }
        });
        return;
      }
      this.fileService.loadFile(file.path).subscribe({
        next: (content: string) => {
          this.openFiles.push({
            name: file.name,
            path: file.path,
            folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
            content: content,
            options: this.getCodeMirrorOptions(file.path),
          });
          this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
          setTimeout(() => {
            var activeWrapper = document.querySelector('.active-codemirror-editor');
            var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
            editor.doc.markClean();
            editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
          }, 1);
          this.cdRef.detectChanges();
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
    this.activeFolder = file.path.substring(0, file.path.lastIndexOf('/') + 1);
  }

  /**
   * Invoked when user wants to open a folder.
   *
   * @param folder Tree node wrapping folder to open
   */
  selectFolder(folder: any, keepOpen?: boolean) {
    this.activeFolder = folder.node.path;
    this.openFolder = folder;
  }

  /**
   * Invoked when the currently selected file is changed.
   */
  selectedFileChanged() {
    this.activeFolder = this.currentFileData.folder;
    this.setFocusToActiveEditor();
  }

  /**
   * to be called from a child component
   * Invoked when a file should be renamed.
   *
   * @param name - the given name to be string
   */
  renameActiveFile(name: string) {
    if (!this.currentFileData) {
      return;
    }
    const treeNode = this.findTreeNodeFolder(this.root, this.currentFileData.path);
    treeNode.name = name;
    treeNode.path = this.currentFileData.path.substring(0, this.currentFileData.path.lastIndexOf('/') + 1) + name;
    this.currentFileData.name = treeNode.name;
    this.currentFileData.path = treeNode.path;
    this.dataBindTree();
    this.cdRef.detectChanges();
    this.feedbackService.showInfoShort('File successfully renamed');
    this.getEndpoints();
  }

  /**
   * Invoked from a child component when a file should be deleted.
   *
   * @param path path of the current file to be string
   */
  deleteActiveFile(path: string) {
    if (!this.currentFileData && !path) {
      return;
    }
    if (this.removeNode(path)) {
      this.dataBindTree();
      this.fileActionsComponent.closeActiveFile(true);
    }
    this.feedbackService.showInfoShort('File successfully deleted');
  }

  /**
   * A callback from child component after deleting a folder
   */
  updateAfterDeleteFolder() {
    this.removeNode(this.activeFolder);
    this.feedbackService.showInfoShort('Folder successfully deleted');
    this.openFiles = this.openFiles.filter(x => !x.path.startsWith(this.activeFolder));
    if (this.openFiles.filter(x => x.path === this.currentFileData.path).length === 0) {
      if (this.openFiles.length > 0) {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[0].path)[0];
      } else {
        this.currentFileData = null;
      }
    }
    this.dataBindTree();
    let newFolder = this.activeFolder.substring(0, this.activeFolder.length - 1);
    newFolder = newFolder.substring(0, newFolder.lastIndexOf('/') + 1);
    this.activeFolder = newFolder;
    this.cdRef.detectChanges();
  }

  /**
   * Invoked when user wants to toggle displaying of system files.
   * @callback systemFiles To show warning
   */
  toggleSystemFiles() {
    this.updateFileObject('/');
    if (this.systemFiles) {
      this.showWarning('system');
    }
  }

  /**
   * To show warning if system files option is enabled.
   * @param location string, to be system or file
   */
  showWarning(location: string): void {
    this.bottomSheet.open(WarningComponent, { data: { location: location } });
  }
  /*
   * Returns all folders in system to caller.
   */
  getFolders(current: TreeNode = this.root) {
    const result: string[] = [];
    if (current.isFolder) {
      result.push(current.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      const inner = this.getFolders(idx);
      for (const idxInner of inner) {
        result.push(idxInner);
      }
    }
    return result;
  }

  /**
   * Returns all folders in system to caller.
   */
  getFiles(current: TreeNode = this.root) {
    let result: string[] = [];
    for (const idx of current.children.filter(x => !x.isFolder)) {
      result.push(idx.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      result = result.concat(this.getFiles(idx));
    }
    return result;
  }

  /*
   * Returns an endpoint matching the specified file node, or null if file cannot
   * be matched to an endpoint.
   */
  getEndpoint(file: FileNode) {
    if (file?.path?.startsWith('/modules/') || file?.path?.startsWith('/system/')) {
      const lastSplits = file.name.split('.');
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
            const url = 'magic' + file.folder + lastSplits[0];
            let endpoints = this.endpoints.filter(x => x.path === url && x.verb === lastSplits[lastSplits.length - 2]);
            if (endpoints.length > 0) {
              return endpoints[0];
            }
        }
      }
    }
    return null;
  }

  /**
   * Callback function from child component invoked after creating a new file or folder object
   *
   * @param event an array coming from the child component when new file/folder is created
   */
  manageAfterCreateNewFileObject(event: any) {
    const node = this.findTreeNodeFolder(this.root, event.dialogResult.path);
    const sorter = () => {
      node.children.sort((lhs: TreeNode, rhs: TreeNode) => {
        if (lhs.isFolder && !rhs.isFolder) {
          return -1;
        } else if (!lhs.isFolder && rhs.isFolder) {
          return 1;
        }
        const lhsLowers = lhs.path.toLowerCase();
        const rhsLowers = rhs.path.toLowerCase();
        if (lhsLowers < rhsLowers) {
          return -1;
        } else if (lhsLowers > rhsLowers) {
          return 1;
        }
        return 0;
      });
    };
    if (event.dialogResult.isFolder) {
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: true,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
      });
      sorter();
      this.dataBindTree();
    } else {
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: false,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
      });

      sorter();
      this.dataBindTree();
      this.cdRef.detectChanges();
      this.getEndpoints();
      this.updateFileObject(event.objectPath);
    }
  }

  /**
   * A callback function from child component after macro executed.
   *
   * @param fileObject string to be defined by child component if execution result startsWith 'folders-changed|'
   */
  updateAfterMacro(fileObject: string) {
    if (fileObject === null) {
      this.root.children = [];
      this.getFilesFromServer('/', () => {
        this.getEndpoints();
      });
    } else {
      this.updateFileObject(fileObject);
    }
  }

  /**
   * A callback function from child component to rename active folder.
   *
   * @param fileObject Folder to rename
   */
  afterRenamingFolder(fileObject: any) {
    var toUpdate = fileObject.newName.substring(0, fileObject.newName.length - 1);
    toUpdate = toUpdate.substring(0, toUpdate.lastIndexOf('/') + 1);
    this.updateFileObject(toUpdate);
    this.activeFolder = fileObject.newName;
    for (const idx of this.openFiles) {
      if (idx.folder.startsWith(fileObject.oldName)) {
        idx.folder = fileObject.newName + idx.folder.substring(fileObject.oldName.length);
        idx.path = fileObject.newName + idx.path.substring(fileObject.oldName.length);
      }
    }
    this.openFolder.node.path = this.activeFolder;
    const entities = fileObject.newName.split('/').filter(x => x !== '');
    this.openFolder.node.name = entities[entities.length - 1];
    this.openFolder.name = entities[entities.length - 1];
    this.selectFolder(this.openFolder, true)
  }

  /**
   * Actual method responsible for closing file.
   */
  closeFileImpl() {
    this.cdRef.markForCheck();
    let idx: number;
    this.openFiles.forEach(element => {
      if (element.path === this.currentFileData.path) {
        idx = this.openFiles.indexOf(element);
      }
    });
    this.openFiles.splice(idx, 1);

    if (this.openFiles.length === 0) {
      this.currentFileData = null;
    } else {
      if (idx === 0) {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[0].path)[0];
      } else {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[idx - 1].path)[0];
      }
    }
    this.setFocusToActiveEditor();
    this.cdRef.detectChanges();
  }

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  getEndpoints(onAfter: () => void = null) {
    this.endpointService.endpoints().subscribe({
      next: (endpoints: Endpoint[]) => {
        this.endpoints = endpoints;
        this.cdRef.detectChanges();
        if (onAfter) {
          onAfter();
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Inserts specified Hyperlambda at caret's position.
   *
   * @param content Hyperlambda to insert
   */
  insertHyperlambda(content: string) {
    var activeWrapper = document.querySelector('.active-codemirror-editor');
    if (activeWrapper) {
      var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
      if (editor) {
        let result = '';
        const indentation = editor.doc.sel.ranges[0].anchor.ch;
        if (indentation % 3 !== 0) {
          this.feedbackService.showError('Indentation must be modulo of 3');
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
   * Updates the specified folder or file object only and re-renders TreeView.
   *
   * @param fileObject File object to update
   */
  updateFileObject(fileObject: string) {
    var folder = fileObject;
    var isFile = false;
    if (!fileObject.endsWith('/')) {
      folder = folder.substring(0, folder.lastIndexOf('/') + 1);
      isFile = true;
    }

    let parent = this.root;
    const entities = folder.split('/').filter(x => x !== '');
    for (const idxPeek of entities.slice(0, entities.length)) {
      parent = parent.children.filter(x => x.name === idxPeek)[0];
    }
    parent.children = [];
    this.getFilesFromServer(folder, isFile ? () => {
      this.fileService.loadFile(fileObject).subscribe({
        next: (content: string) => {
          this.openFiles.push({
            name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
            path: fileObject,
            folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
            content: content,
            options: this.getCodeMirrorOptions(fileObject),
          });
          this.currentFileData = this.openFiles.filter(x => x.path === fileObject)[0];
          setTimeout(() => {
            var activeWrapper = document.querySelector('.active-codemirror-editor');
            var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
            editor.doc.markClean();
          }, 1);
          this.cdRef.detectChanges();

          // If the code mirror can't open the file.
          // Lets the user decide what to do with it.
          if (this.getCodeMirrorOptions(fileObject) === null){
            const dialog = this.dialog.open(IncompatibleFileDialogComponent, {
              width: '550px',
              data: {
                name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
              },
            });
            dialog.afterClosed().subscribe((data: { deleteFile: false, download: false }) => {
              if (data && data.download) {
                this.fileActionsComponent.downloadActiveFile(fileObject)
              } else if (data && data.deleteFile) {
                this.fileActionsComponent.deleteActiveFile(fileObject)
              }
            });
            return;
          }
        },
        error: (error: any) => this.feedbackService.showError(error)});
    } : () => {
      this.getEndpoints();
    });
  }

  /*
   * Private and protected helper methods.
   */

  /**
   * Invoked when files needs to be fetched from the server.
   */
  private getFilesFromServer(folder: string = '/', onAfter: () => void = null) {
    const functor = (objects: string[], isFolder: boolean) => {
      for (const idx of objects) {
        const entities = idx.split('/').filter(x => x !== '');
        let parent = this.root;
        let level = 1;
        for (const idxPeek of entities.slice(0, -1)) {
          parent = parent.children.filter(x => x.name === idxPeek)[0];
          level += 1;
        }
        parent.children.push({
          name: entities[entities.length - 1],
          path: idx,
          isFolder: isFolder,
          level: level,
          children: [],
        });
      }
    };

    this.fileService.listFoldersRecursively(folder, this.systemFiles).subscribe({
      next: (folders: string[]) => {
        functor(folders || [], true);
        this.fileService.listFilesRecursively(folder, this.systemFiles).subscribe({
          next: (files: string[]) => {
            functor(files || [], false);
            if (folder === '/') {

              // Preparing a list of file systems,
              // if file system is enabled
              const name1: any = [];
              if (this.systemFiles) {
                name1.push(this.root.children.filter(newData => !this.dataSource.data.map(oldData => oldData.name).includes(newData.name)));
              }

              this.dataSource.data = this.root.children;

              // if file system is enabled, then set a new field as systemFile to true
              if (this.systemFiles) {
                this.dataSource.data.map(x => name1[0].forEach(element => {
                  if (x.name === element.name) {
                    x['systemFile'] = true;
                  }
                }))
              }
            } else {
              this.dataBindTree();
            }
            if (onAfter) {
              onAfter();
            }

            // To start resizing the mat-drawer section
            // preventing from miscalculation of the width, as mentioned inside material docs
            // and looking for changes to update value in the html file
            this.startResizing = true;
            this.cdRef.detectChanges();
          },
          error: (error: any) => this.feedbackService.showError(error)});
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Invoked when we need to find the specified tree node.
   */
  private findTreeNodeFolder(node: TreeNode, path: string): TreeNode {
    if (node.path === path) {
      return node;
    }
    for (const idx of node.children) {
      const tmpResult = this.findTreeNodeFolder(idx, path);
      if (tmpResult) {
        return tmpResult
      }
    }
    return null;
  }

  /*
   * Invoked when a node should be removed from tree node collection.
   */
  private removeNode(path: string, node: TreeNode = this.root) {
    const toBeRemoved = node.children.filter(x => x.path === path);
    if (toBeRemoved.length > 0) {
      node.children.splice(node.children.indexOf(toBeRemoved[0]), 1);
      return true;
    }
    for (const idx of node.children.filter(x => path.startsWith(x.path))) {
      if (this.removeNode(path, idx)) {
        return true;
      }
    }
    return false;
  }

  /*
   * Databinds tree control such that expanded items stays expanded.
   */
  private dataBindTree() {
    const expanded: FlatNode[] = [];
    for (const idx of this.treeControl.dataNodes) {
      if (this.treeControl.isExpanded(idx)) {
        expanded.push(idx);
        expanded.push(this.openFolder);
      }
    }
    this.dataSource.data = this.root.children;
    for (const idx of this.treeControl.dataNodes) {
      if (expanded.filter(x => (<any>x).node.path === (<any>idx).node.path).length > 0) {
        this.treeControl.expand(idx);
      }
    }
  }

  /*
   * Helper method to clone any object.
   */
  private clone(obj: any) {
    var cloneObj: any = {};
    for (var attribut in obj) {
      if (typeof obj[attribut] === "object") {
        cloneObj[attribut] = this.clone(obj[attribut]);
      } else {
        cloneObj[attribut] = obj[attribut];
      }
    }
    return cloneObj;
  }

  /*
   * Returns options for CodeMirror editor.
   */
  private getCodeMirrorOptions(path: string) {
    const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
    let options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
    if (options.length === 0) {
      return null;
    } else {
      options[0] = this.clone(options[0]);
      if (options[0].options.extraKeys) {
        options[0].options.extraKeys['Alt-M'] = (cm: any) => {
          this.ngZone.run(() => {
            this.cdRef.detectChanges();
            let sidenav = document.querySelector('.mat-sidenav');
            sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
              sidenav.classList.add('d-none');
            this.drawer.close();
          });
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        };
        options[0].options.extraKeys['Alt-S'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.saveActiveFile();
          });
        };
        options[0].options.extraKeys['Alt-D'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.deleteActiveFile();
          });
        };
        options[0].options.extraKeys['Alt-C'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.closeActiveFile()
          });
        };
        options[0].options.extraKeys['Alt-R'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.renameActiveFile();
          });
        };
        options[0].options.extraKeys['Alt-L'] = (cm: any) => {
          this.ngZone.run(() => {
            this.folderActionsComponent.renameActiveFolder();
          });
        };
        options[0].options.extraKeys['Alt-V'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.insertSnippet();
          });
        };
        options[0].options.extraKeys['Alt-O'] = (cm: any) => {
          this.ngZone.run(() => {
            this.folderActionsComponent.selectMacro();
          });
        };
        options[0].options.extraKeys['Alt-A'] = (cm: any) => {
          this.ngZone.run(() => {
            this.folderActionsComponent.createNewFileObject('file');
          });
        };
        options[0].options.extraKeys['Alt-B'] = (cm: any) => {
          this.ngZone.run(() => {
            this.folderActionsComponent.createNewFileObject('folder');
          });
        };
        options[0].options.extraKeys['Alt-X'] = (cm: any) => {
          this.ngZone.run(() => {
            this.folderActionsComponent.deleteActiveFolder();
          });
        };
        options[0].options.extraKeys['Alt-P'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.previewActiveFile();
          });
        };
        options[0].options.extraKeys['F5'] = (cm: any) => {
          this.ngZone.run(() => {
            this.fileActionsComponent.executeActiveFile();
          });
        };
      }
      return options[0].options;
    }
  }

  /*
   * Sets focus to active editor.
   */
  private setFocusToActiveEditor() {
    setTimeout(() => {
      var activeWrapper = document.querySelector('.active-codemirror-editor');
      if (activeWrapper) {
        var editor = (<any>activeWrapper.querySelector('.CodeMirror'))?.CodeMirror;
        if (editor) {
          editor.focus();
        }
      }
    }, 1);
  }
}
