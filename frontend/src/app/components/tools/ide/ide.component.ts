
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

// Application specific imports.
import { FlatNode } from './models/flat-node.model';
import { FileNode } from './models/file-node.model';
import { TreeNode } from './models/tree-node.model';
import { Message } from '../../../models/message.model';
import { FileService } from '../../files/services/file.service';
import { MessageService } from '../../../services/message.service';
import { FeedbackService } from '../../../services/feedback.service';
import { AuthService } from '../../management/auth/services/auth.service';
import { Endpoint } from '../../analytics/endpoints/models/endpoint.model';
import { EvaluatorService } from '../evaluator/services/evaluator.service';
import { EndpointService } from '../../analytics/endpoints/services/endpoint.service';
import { GenerateCrudAppComponent } from './generate-crud-app/generate-crud-app.component';

// File types extensions.
import fileTypes from '../../files/file-editor/file-types.json';
import { FileActionsComponent } from './action-buttons/file-actions/file-actions.component';
import { FolderActionsComponent } from './action-buttons/folder-actions/folder-actions.component';

/**
 * IDE component for creating Hyperlambda apps.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdeComponent implements OnInit, OnDestroy {

  @ViewChild(FileActionsComponent) fileActionsComponent: FileActionsComponent;
  @ViewChild(FolderActionsComponent) folderActionsComponent: FolderActionsComponent;


  // Tree view drawer.
  @ViewChild('drawer') public drawer: MatSidenav;

  /**
   * To get the width of the screen 
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * notSmallScreen {boolean} :: to check whether the screen width is small or large
   */
  public getScreenWidth: number;
  public smallScreenSize: number = 768;
  public notSmallScreen: boolean = undefined;

  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.notSmallScreen = this.getScreenWidth >= this.smallScreenSize ? true : false;
  }

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  // Root tree node pointing to root folder.
  public root: TreeNode = {
    name: '/',
    path: '/',
    isFolder: true,
    children: [],
    level: 0,
  };

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

  /**
   * Actual tree control for component.
   */
  public treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);

  /**
   * Actual data source for tree control.
   */
  public dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // To start resizing the mat-drawer section
  // preventing from miscalculation of the width, as mentioned inside material docs
  public startResizing: boolean = false;

  /**
   * Currently edited files.
   */
  public openFiles: FileNode[] = [];

  /**
   * Currently selected file.
   */
  public currentFileData: FileNode;

  /**
   * Currently active folder, which is dependent upon file selected, etc.
   */
  public activeFolder: string = '/';

  /*
   * Model describing endpoints in your installation.
   */
  private endpoints: Endpoint[];

  /*
   * Subscription allowing us to subscribe to messages relevant for component.
   */
  private subscription: Subscription;

  /**
   * Needed to be kept around such that we can explicitly close it after having CRUDified some database/table.
   */
  private generateCrudDialog: MatDialogRef<GenerateCrudAppComponent> = null;

  /**
  * Current folder we're viewing contens of.
  */
  public currentFolder = '/';

  /**
   * boolean:: system files sliding value
   * if true, all files will be displayed
   * default value is false.
   */
  public systemFiles: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param cdRef Needed to mark component as having changes
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param evaluatorService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   * @param messageService Service used to publish messages to other components in the system
   * @param endpointService Needed to retrieve endpoints from backend
   */
  public constructor(
    private cdRef: ChangeDetectorRef,
    public authService: AuthService,
    private fileService: FileService,
    private feedbackService: FeedbackService,
    private evaluatorService: EvaluatorService,
    private messageService: MessageService,
    private endpointService: EndpointService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving screen size to decide which mode the folders' drawer should be.
    this.onWindowResize();

    // Retrieving files and folder from server.
    this.getFilesFromServer('/', () => {

      /*
       * Retrieving endpoints from server.
       * This is necessary to determine if Hyperlambda files should be executed or invoked.
       */
      this.getEndpoints();
    });

    // Subscribing to relevant messages.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      if (msg.name === 'magic.folders.update') {

        // Some other component informed us that we need to update some specific folder.
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

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }

      } else if (msg.name === 'magic.crudifier.frontend-generated-locally') {

        // Some other component informed us that we need to update our folders.
        this.updateFileObject('/etc/');

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }

        // Providing some feedback to user.
        this.feedbackService.showInfo('Frontend was generated and saved to your \'/etc/frontends/\' folder')

      } else if (msg.name === 'magic.crudifier.frontend-generated') {

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }
      }
    });
  }

  /**
   * Implementation of AfterViewInit.
   * 
   * This is needed to ensure we retrieve Hyperlambda vocabulary from backend to
   * have autocomplete data for Hyperlambda language.
   */
  public ngAfterViewInit() {

    // Retrieving server's vocabulary.
    if (!window['_vocabulary']) {

      // Loading vocabulary from server before initializing editor.
      this.evaluatorService.vocabulary().subscribe((vocabulary: string[]) => {

        // Publishing vocabulary such that autocomplete component can reach it.
        window['_vocabulary'] = vocabulary;

      }, error => this.feedbackService.showError(error));
    }
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Making sure we unsubscribe to our subscription.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  /**
   * Returns true if specified node has children.
   */
  public isExpandable(_: number, node: FlatNode) {
    return node.expandable;
  }

  /**
   * Invoked when user wants to open a file.
   * 
   * @param file Tree node wrapping file to open
   */
  public openFile(file: TreeNode) {

    // Checking if file is already opened.
    if (this.openFiles.filter(x => x.path === file.path).length > 0) {

      // Yup, file already opened.
      this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];

      // Setting focus to active editor.
      this.setFocusToActiveEditor();

    } else {

      // Retrieving file's content from backend.
      this.fileService.loadFile(file.path).subscribe((content: string) => {

        // Pushing specified file into files currently being edited object.
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
        }, 1);

        // Making sure we re-check component for changes to avoid CDR errors.
        this.cdRef.detectChanges();

      }, (error: any) => this.feedbackService.showError(error));
    }

    // Changing active folder.
    this.activeFolder = file.path.substring(0, file.path.lastIndexOf('/') + 1);
  }

  /**
   * Invoked when user wants to open a folder.
   * 
   * @param folder Tree node wrapping folder to open
   */
  public selectFolder(folder: any) {
    this.activeFolder = folder.node.path;
    if (this.treeControl.isExpanded(folder) === true) {
      this.treeControl.expand(folder);
    } else {
      this.treeControl.collapse(folder);
    }
  }

  /**
   * Invoked when the currently selected file is changed.
   */
  public selectedFileChanged() {
    this.activeFolder = this.currentFileData.folder;
    this.setFocusToActiveEditor();
  }

  /**
   * to be called from a child component
   * Invoked when a file should be renamed.
   * 
   * @param name - the given name to be string
   */
  public renameActiveFile(name: string) {

    // Ensuring we actually have an active file.
    if (!this.currentFileData) {
      return;
    }

    // Updating treeview model.
    const treeNode = this.findTreeNodeFolder(this.root, this.currentFileData.path);
    treeNode.name = name;
    treeNode.path = this.currentFileData.path.substring(0, this.currentFileData.path.lastIndexOf('/') + 1) + name;

    // Updating model.
    this.currentFileData.name = treeNode.name;
    this.currentFileData.path = treeNode.path;

    // Databinding tree again.
    this.dataBindTree();
    this.cdRef.detectChanges();

    // Showing user some feedback.
    this.feedbackService.showInfoShort('File successfully renamed');

    // We'll need to re-retrieve endpoints now, to allow for executing file correctly.
    this.getEndpoints();
  }

  /**
   * Invoked from a child component when a file should be deleted.
   * 
   * @param path path of the current file to be string
   */
  public deleteActiveFile(path: string) {

    // Ensuring we actually have open files.
    if (!this.currentFileData) {
      return;
    }

    // Removing node from collection.
    if (this.removeNode(path)) {

      // This will databind the tree control again, making sure we keep expanded nodes as such.
      this.dataBindTree();

      // Closing file.
      this.fileActionsComponent.closeActiveFile(true);
    }

    // Providing feedback to user.
    this.feedbackService.showInfoShort('File successfully deleted');

  }

  /**
   * A callback from child component after deleting a folder
   */
  public updateAfterDeleteFolder() {
    // Showing feedback to user and updating treeview.
    this.removeNode(this.activeFolder);
    this.feedbackService.showInfoShort('Folder successfully deleted');

    // Making sure we remove all files existing within the folder that are currentl edited.
    this.openFiles = this.openFiles.filter(x => !x.path.startsWith(this.activeFolder));

    // Verifying that active file is not one of the files actually removed in above logic.
    if (this.openFiles.filter(x => x.path === this.currentFileData.path).length === 0) {

      // Verifying there are any open files left.
      if (this.openFiles.length > 0) {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[0].path)[0];
      } else {
        this.currentFileData = null;
      }
    }

    // Databinding tree again.
    this.dataBindTree();

    // Resetting active folder to root folder.
    this.activeFolder = '/';
    this.cdRef.detectChanges();
  }

  /**
   * Invoked when user wants to toggle displaying of system files.
   */
  public toggleSystemFiles() {
    this.updateFileObject('/');
  }

  /*
   * Private and protected helper methods.
   */

  /*
   * Returns an endpoint matching the specified file node, or null if file cannot
   * be matched to an endpoint.
   */
  public getEndpoint(file: FileNode) {

    // Notice, only files inside of "/modules/" and "/system/" can be endpoint files.
    if (file?.path?.startsWith('/modules/') || file?.path?.startsWith('/system/')) {

      // Splitting filename of file to check if it's semantically correct according to how an endpoint file should be.
      const lastSplits = file.name.split('.');
      if (lastSplits.length >= 3 && lastSplits[lastSplits.length - 1] === 'hl') {

        // Hyperlambda file, with 3 or more entities, possibly an endpoint file.
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

              // File is a Hyperlambda endpoint, hence returning endpoint to caller.
              return endpoints[0];
            }
        }
      }
    }

    // File is not a Hyperlambda endpoint file.
    return null;
  }

  /**
   * Invoked when files needs to be fetched from the server.
   */
  private getFilesFromServer(folder: string = '/', onAfter: () => void = null) {

    // Common function object for adding folders and files to root graph object.
    const functor = (objects: string[], isFolder: boolean) => {

      // Adding folder to root graph object.
      for (const idx of objects) {

        // Finding parent node of currently iterated folder.
        const entities = idx.split('/').filter(x => x !== '');
        let parent = this.root;
        let level = 1;
        for (const idxPeek of entities.slice(0, -1)) {
          parent = parent.children.filter(x => x.name === idxPeek)[0];
          level += 1;
        }

        // Adding folder to graph object, now under correct parent.
        parent.children.push({
          name: entities[entities.length - 1],
          path: idx,
          isFolder: isFolder,
          level: level,
          children: [],
        });
      }
    };

    // Retrieving files from backend.
    this.fileService.listFoldersRecursively(folder, this.systemFiles).subscribe((folders: string[]) => {

      // Adding folder to root graph object.
      functor(folders || [], true);

      // Retrieving all files from backend.
      this.fileService.listFilesRecursively(folder, this.systemFiles).subscribe((files: string[]) => {

        // Adding files to root graph object.
        functor(files || [], false);

        // Databinding tree control initially.
        if (folder === '/') {

          // Initial databinding of tree.
          this.dataSource.data = this.root.children;

        } else {

          // Re-databinding tree, hence data binding such that we keep expanded folders as such.
          this.dataBindTree();
        }

        // Checking if caller supplied an onAfter callback, and if so, invoking it.
        if (onAfter) {
          onAfter();
        }

        // To start resizing the mat-drawer section
        // preventing from miscalculation of the width, as mentioned inside material docs
        // and looking for changes to update value in the html file
        this.startResizing = true;
        this.cdRef.detectChanges();

      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Returns all folders in system to caller.
   */
  public getFolders(current: TreeNode = this.root) {

    // Finding all folders in currently iterated level.
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

  /*
   * Returns all folders in system to caller.
   */
  public getFiles(current: TreeNode = this.root) {

    // Finding all files in currently iterated level.
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
   * Invoked when we need to find the specified tree node.
   */
  private findTreeNodeFolder(node: TreeNode, path: string): TreeNode {

    // Checking if this is the guy we're looking for.
    if (node.path === path) {
      return node;
    }

    // Recursively searching through children nodes.
    for (const idx of node.children) {
      const tmpResult = this.findTreeNodeFolder(idx, path);
      if (tmpResult) {

        // This is our guy!
        return tmpResult
      }
    }
    return null;
  }

  /*
   * Invoked when a node should be removed from tree node collection.
   */
  private removeNode(path: string, node: TreeNode = this.root) {

    // Checking if node to be removed exists in current node's children collection.
    const toBeRemoved = node.children.filter(x => x.path === path);
    if (toBeRemoved.length > 0) {
      node.children.splice(node.children.indexOf(toBeRemoved[0]), 1);
      return true;
    }

    // Recursively iterate children collection.
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

    // Storing all expanded items in tree control.
    const expanded: FlatNode[] = [];
    for (const idx of this.treeControl.dataNodes) {
      if (this.treeControl.isExpanded(idx)) {
        expanded.push(idx);
      }
    }

    // Re-databinding tree control.
    this.dataSource.data = this.root.children;

    // Expanding all items that was previously expanded.
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

  /**
   * it's a callback function from child component
   * @param event an array coming from the child component when new file/folder is created
   * event = { dialogResult: any, objectPath: string }
   */
  manageAfterCreateNewFileObject(event: any) {
    // Finding tree node for where file/folder is to be created, such that we can inject object into tree structure.
    const node = this.findTreeNodeFolder(this.root, event.dialogResult.path);

    // Common sorter object used for both files and folders branch.
    const sorter = () => {

      // Sorting children such that folder comes before files, and everything else is sorted case insensitively.
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
      // Adding tree node for folder into tree node hierarchy.
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: true,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
      });

      // Making sure we sort nodes at level before we databind tree control again.
      sorter();

      // Databinding tree control again, ensuring we keep expanded folders expanded.
      this.dataBindTree();
    } else {

      // Pushing file on to currently edited files list.
      this.openFiles.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        folder: event.objectPath.substring(0, event.objectPath.lastIndexOf('/') + 1),
        options: this.getCodeMirrorOptions(event.objectPath),
        content: event.dialogResult.template || '// File content here ...'
      });

      // Adding tree node for file into treeview hierarchy.
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: false,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
      });

      // Making sure newly created file becomes active.
      this.currentFileData = this.openFiles.filter(x => x.path === event.objectPath)[0];

      // Making sure we sort nodes at level before we databind tree control again.
      sorter();

      // Databinding tree control again such that expanded nodes are still expanded.
      this.dataBindTree();

      // Marking document as clean.
      this.fileActionsComponent.saveActiveFile();

      // Making sure we re-check component for changes to avoid CDR errors.
      this.cdRef.detectChanges();

      // We'll need to retrieve endpoints again, to allow for executing file.
      this.getEndpoints();
    }
  }

  /**
   * A callback function from child component after macro executed
   * @param fileObject string to be defined by child component if execution result startsWith 'folders-changed|'
   */
  public updateAfterMacro(fileObject: string) {
    if (fileObject === null) {
      // Refreshing files and folder.
      this.root.children = [];
      this.getFilesFromServer('/', () => {
        this.getEndpoints();
      });
    } else {
      this.updateFileObject(fileObject);
    }
  }

  /*
   * Returns options for CodeMirror editor.
   */
  private getCodeMirrorOptions(path: string) {

    // We're supposed to create a file. Notice, we don't actually create the file, only open it in edit mode.
    const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
    let options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
    if (options.length === 0) {

      // Oops, no editor for file type, defaulting to Markdown bugger.
      options = this.extensions.filter(x => x.options.mode === 'markdown');
    }

    // Cloning options object.
    options[0] = this.clone(options[0]);

    // Turning on keyboard shortcuts.
    if (options[0].options.extraKeys) {

      // Alt+M maximises editor.
      options[0].options.extraKeys['Alt-M'] = (cm: any) => {

        // Hiding treeview drawer
        this.cdRef.detectChanges();
        let sidenav = document.querySelector('.mat-sidenav');
        sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
          sidenav.classList.add('d-none');
        this.drawer.close();

        // Toggling maximise mode.
        cm.setOption('fullScreen', !cm.getOption('fullScreen'));
      };

      // Alt+S saves the active file.
      options[0].options.extraKeys['Alt-S'] = (cm: any) => {
        this.fileActionsComponent.saveActiveFile();
      };

      // Alt+D deletes the active file.
      options[0].options.extraKeys['Alt-D'] = (cm: any) => {
        this.fileActionsComponent.deleteActiveFile();
      };

      // Alt+C closes the active file.
      options[0].options.extraKeys['Alt-C'] = (cm: any) => {
        this.fileActionsComponent.closeActiveFile()
      };

      // Alt+R renames the active file.
      options[0].options.extraKeys['Alt-R'] = (cm: any) => {
        this.fileActionsComponent.renameActiveFile();
      };

      // Alt+O opens up the select macro window.
      options[0].options.extraKeys['Alt-O'] = (cm: any) => {
        this.folderActionsComponent.selectMacro();
      };

      // Alt+A opens up create new file object dialog.
      options[0].options.extraKeys['Alt-A'] = (cm: any) => {
        this.folderActionsComponent.createNewFileObject('file');
      };

      // Alt+B opens up create new folder object dialog.
      options[0].options.extraKeys['Alt-B'] = (cm: any) => {
        this.folderActionsComponent.createNewFileObject('folder');
      };

      // Alt+X deletes currently selected folder.
      options[0].options.extraKeys['Alt-X'] = (cm: any) => {
        this.folderActionsComponent.deleteActiveFolder();
      };

      // Alt+P shows apreview of active file.
      options[0].options.extraKeys['Alt-P'] = (cm: any) => {
        this.fileActionsComponent.previewActiveFile();
      };

      // F5 executes active file.
      options[0].options.extraKeys['F5'] = (cm: any) => {
        this.fileActionsComponent.executeActiveFile();
      };
    }
    return options[0].options;
  }

  /*
   * Actual method responsible for closing file.
   */
  public closeFileImpl() {

    // Removing file from edited files.
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

    // Making sure we give focus to newly activated editor.
    this.setFocusToActiveEditor();
    this.cdRef.detectChanges();
  }

  /*
   * Sets focus to active editor.
   */
  private setFocusToActiveEditor() {

    // Needs to be delayed.
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

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  public getEndpoints(onAfter: () => void = null) {

    // Invoking backend to retrieve endpoints.
    this.endpointService.endpoints().subscribe((endpoints: Endpoint[]) => {

      // Assigning model to result of invocation.
      this.endpoints = endpoints;

      // Checking if caller supplied a function to invoke after we're done.
      if (onAfter) {
        onAfter();
      }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Updates the specified folder or file object only and re-renders TreeView.
   */
  public updateFileObject(fileObject: string) {

    // Figuring out folder to refresh, since fileObject might be a file or a folder.
    var folder = fileObject;
    var isFile = false;
    if (!fileObject.endsWith('/')) {

      // File object is a file.
      folder = folder.substring(0, folder.lastIndexOf('/') + 1);
      isFile = true;
    }

    // Finding specified folder in data source.
    let parent = this.root;
    const entities = folder.split('/').filter(x => x !== '');
    for (const idxPeek of entities.slice(0, entities.length)) {
      parent = parent.children.filter(x => x.name === idxPeek)[0];
    }

    // Clearing folder's children collection.
    parent.children = [];

    // Re-databinding specified folder by invoking server with folder as root object.
    this.getFilesFromServer(folder, isFile ? () => {

      // Retrieving file's content from backend.
      this.fileService.loadFile(fileObject).subscribe((content: string) => {

        // Pushing specified file into files currently being edited object.
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

        // Making sure we re-check component for changes to avoid CDR errors.
        this.cdRef.detectChanges();

      });
    } : null);
  }
}
