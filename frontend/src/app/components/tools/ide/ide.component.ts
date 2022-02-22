
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

// Application specific imports.
import { FlatNode } from './models/flat-node.model';
import { FileNode } from './models/file-node.model';
import { TreeNode } from './models/tree-node.model';
import { Message } from '../../../models/message.model';
import { Response } from '../../../models/response.model';
import { AuthService } from '../../management/auth/services/auth.service';
import { FileService } from '../../files/services/file.service';
import { Endpoint } from '../../analytics/endpoints/models/endpoint.model';
import { MessageService } from '../../../services/message.service';
import { FeedbackService } from '../../../services/feedback.service';
import { EndpointService } from '../../analytics/endpoints/services/endpoint.service';
import { EvaluatorService } from '../evaluator/services/evaluator.service';
import { MacroDefinition } from '../../files/services/models/macro-definition.model';
import { GenerateCrudAppComponent } from './generate-crud-app/generate-crud-app.component';
import { PreviewFileDialogComponent } from './preview-file-dialog/preview-file-dialog.component';
import { ExecuteMacroDialogComponent } from './execute-macro-dialog/execute-macro-dialog.component';
import { Macro, SelectMacroDialogComponent } from './select-macro-dialog/select-macro-dialog.component';
import { ExecuteEndpointDialogComponent } from './execute-endpoint-dialog/execute-endpoint-dialog.component';
import { FileObjectName, RenameFileDialogComponent } from './rename-file-dialog/rename-file-dialog.component';
import { FileObject, NewFileFolderDialogComponent } from './new-file-folder-dialog/new-file-folder-dialog.component';

// File types extensions.
import fileTypes from '../../files/file-editor/file-types.json';
import { MatSidenav } from '@angular/material/sidenav';

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

  // toggle folder section
  public expandSide: boolean = true;
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
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.notSmallScreen = (this.getScreenWidth > this.smallScreenSize || this.getScreenWidth === this.smallScreenSize) ? true : false;
  }

  // only to pass the current file's data into the menu for action buttons
  public currentFileData: any;

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  // Root tree node pointing to root folder.
  private root: TreeNode = {
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
  // to start resizing the mat-drawer section
  // preventing from miscalculation of the width, as mentioned inside material docs
  public startResizing: boolean = false;

  /**
   * Currently edited files.
   */
  public openFiles: FileNode[] = [];

  /**
   * Currently active edited file's full path.
   */
  public activeFile: string = '';

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
   * Model for file uploader.
   */
  public fileInput: string[];
  public zipFileInput;

  /**
  * Current folder we're viewing contens of.
  */
  public currentFolder = '/';


  /**
   * boolean:: system files sliding value
   * if true, all files will be displayed
   * defaut value is false
   */
  public systemFiles: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogs
   * @param cdRef Needed to mark component as having changes
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param messageService Service used to publish messages to other components in the system
   * @param evaluatorService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   * @param messageService Needed to subscribe to relevant messages transmitted from other components
   * @param endpointService Needed to retrieve endpoints from backend
   */
  public constructor(
    private dialog: MatDialog,
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

    // Retrieving screen size to decide which mode the folders' drawer should be
    this.onWindowResize();

    // Retrieving files and folder from server.
    this.getFilesFromServer('/', () => {

      // Retrieving endpoints from server.
      this.getEndpoints();
    });

    // Subscribing to relevant messages.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      if (msg.name === 'magic.folders.update') {

        // Some other component informed us that we need to update our folders.
        this.updateFolder(msg.content);

        /*
         * If folder that was updated was a folder that could in theory contain endpoints,
         * we re-retrieve endpoints from server.
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
        this.updateFolder('/etc/');

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
   * Implementation of AfterViewInit
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
   * Invoked when files needs to be fetched from the server.
   */
  public getFilesFromServer(folder: string = '/', onAfter: () => void = null) {

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
    this.fileService.listFoldersRecursively(folder).subscribe((folders: string[]) => {

      // Adding folder to root graph object.
      functor(folders || [], true);

      // Retrieving all files from backend.
      this.fileService.listFilesRecursively(folder).subscribe((files: string[]) => {

        // Adding files to root graph object.
        functor(files || [], false);

        // Databinding tree control initially.
        if (folder === '/') {

          // Initial databinding of tree.
          this.dataSource.data = this.root.children;

        } else {

          // Re-databinding tree, hence databinding such that we keep expanded folders as such.
          this.dataBindTree();
        }

        // Checking if caller supplied an onAfter callback, and if so, invoking it.
        if (onAfter) {
          onAfter();
        }

        // to start resizing the mat-drawer section
        // preventing from miscalculation of the width, as mentioned inside material docs
        // and looking for changes to update value in the html file
        this.startResizing = true;
        this.cdRef.detectChanges();
      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to create a new file or folder.
   */
  public createNewFileObject(type: string) {

    // Retrieving all existing folders in system to allow user to select folder to create object within.
    const folders = this.getFolders();

    // Retieving all existing files to prevent user from creating a new file that already exists.
    const files = this.getFiles();

    // Creating modal dialog responsible for asking user for name and type of object.
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

        // Finding tree node for where file/folder is to be created, such that we can inject object into tree structure.
        const node = this.findTreeNodeFolder(this.root, result.path);

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

        // Firguing out path of file or folder.
        let path = result.path + result.name;

        // Checking if we're creating a folder or a file.
        if (result.isFolder) {

          // Making sure we append end slash.
          path += '/';

          // We're supposed to create a folder.
          this.fileService.createFolder(path).subscribe(() => {

            // Showing user some feedback.
            this.feedbackService.showInfoShort('Folder successfully created');

            // Adding tree node for folder into tree node hierarchy to make sure tree control is updated.
            node.children.push({
              name: result.name,
              path: path,
              isFolder: true,
              level: result.path.split('/').filter(x => x !== '').length + 1,
              children: [],
            });

            // Making sure we sort nodes at level before we databind tree control again.
            sorter();

            // Databinding tree control again.
            this.dataBindTree();

          }, (error: any) => this.feedbackService.showError(error));

        } else {

          // Pushing file on to currently edited files list.
          const fileNode: FileNode = {
            name: result.name,
            path: path,
            folder: path.substring(0, path.lastIndexOf('/') + 1),
            options: this.getCodeMirrorOptions(path),
            content: result.template || '// File content here ...'
          };
          this.openFiles.push(fileNode);

          // Adding tree node for folder into tree node hierarchy to make sure tree control is updated.
          node.children.push({
            name: result.name,
            path: path,
            isFolder: false,
            level: result.path.split('/').filter(x => x !== '').length + 1,
            children: [],
          });

          // Making sure file becomes active.
          this.activeFile = path;

          // Making sure we sort nodes at level before we databind tree control again.
          sorter();

          // Databinding tree control again.
          this.dataBindTree();

          // Marking document as clean.
          this.saveFile(fileNode);

          // Making sure we re-check component for changes to avoid CDR errors.
          this.cdRef.detectChanges();

          // We'll need to re-retrieve endpoints now, to allow for executing file.
          this.getEndpoints();
        }
      }
    });
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
      this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
      // Yup, file already opened.
      this.activeFile = file.path;

      // Setting focus to active editor.
      this.setFocusToActiveEditor();

    } else {

      // Retrieving file's content from backend.
      this.fileService.loadFile(file.path).subscribe((content: string) => {
        this.currentFileData = {
          name: file.name,
          path: file.path,
          folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
          content: content,
          options: this.getCodeMirrorOptions(file.path),
        };
        // Pushing specified file into files currently being edited object.
        this.openFiles.push({
          name: file.name,
          path: file.path,
          folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
          content: content,
          options: this.getCodeMirrorOptions(file.path),
        });
        this.activeFile = file.path;
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

    // Assigning model.
    this.activeFolder = this.activeFile.substring(0, this.activeFile.lastIndexOf('/') + 1);

    // specifying the the current open file is changed
    this.currentFileData = this.openFiles.find(x => x.path === this.activeFile);

    // Making sure we give focus to newly activated editor.
    this.setFocusToActiveEditor();
  }

  /**
   * Invoked when a file should be saved.
   * 
   * @param file File to save
   */
  public saveFile(file: FileNode) {

    // Saving file by invoking backend.
    this.fileService.saveFile(file.path, file.content).subscribe(() => {

      // Marking document as clean.
      var activeWrapper = document.querySelector('.active-codemirror-editor');
      var editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;
      editor.doc.markClean();

      // Providing feedback to user.
      this.feedbackService.showInfoShort('File successfully saved');

      // We'll need to re-retrieve endpoints now, to allow for executing file correctly.
      this.getEndpoints();

    }, (error: any) => this.feedbackService.showError(error));
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
  public executeFile(file: FileNode) {

    // Figuring out if file is an endpoint file or not.
    const endpoint = this.getEndpoint(file);
    if (endpoint) {

      // Opening up dialog to allow user to invoke endpoint.
      this.dialog.open(ExecuteEndpointDialogComponent, {
        data: endpoint,
        minWidth: '80%',
      });
    } else {

      // Executing file directly as a Hyperlambda file.
      this.evaluatorService.execute(file.content).subscribe(() => {

        // Providing feedback to user.
        this.feedbackService.showInfoShort('File successfully executed');

      }, (error: any) => this.feedbackService.showError(error));
    }
  }

  /**
   * Invoked when a file should be previewed.
   * 
   * @param file File to preview
   */
  public previewFile(file: FileNode) {

    // Opening up a modal dialog to preview file.
    this.dialog.open(PreviewFileDialogComponent, {
      data: file.content,
    });
  }

  /**
   * Invoked when a file should be renamed.
   * 
   * @param file File to rename
   */
  public renameFile(file: FileNode) {

    // Opening up a modal dialog to preview file.
    const dialog = this.dialog.open(RenameFileDialogComponent, {
      width: '550px',
      data: {
        name: file.name,
      },
    });
    dialog.afterClosed().subscribe((data: FileObjectName) => {

      // Checking if user wants to rename file.
      if (data) {

        // Invoking backend to rename object.
        this.fileService.rename(file.path, data.name).subscribe(() => {

          // Updating treeview model.
          const treeNode = this.findTreeNodeFolder(this.root, file.path);
          treeNode.name = data.name;
          treeNode.path = file.path.substr(0, file.path.lastIndexOf('/') + 1) + data.name;

          // Updating model.
          file.name = treeNode.name;
          file.path = treeNode.path;

          // Updating active file.
          this.activeFile = file.path;

          // Databinding tree again.
          this.dataBindTree();

          // Showing user some feedback.
          this.feedbackService.showInfoShort('File successfully renamed');

          // We'll need to re-retrieve endpoints now, to allow for executing file correctly.
          this.getEndpoints();

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when a file should be deleted.
   * 
   * @param file File to delete
   */
  public deleteFile(file: FileNode) {

    // Asking user to confirm action.
    this.feedbackService.confirm('Confirm action', 'Are you sure you want to delete currently active file?', () => {

      // Deleting file by invoking backend.
      this.fileService.deleteFile(file.path).subscribe(() => {

        // Removing node from collection.
        if (this.removeNode(file.path)) {

          // This will databind the tree control again, making sure we keep expanded nodes as such.
          this.dataBindTree();

          // Closing file.
          this.closeFile(this.openFiles.filter(x => x.path === file.path)[0], true);
        }

        // Providing feedback to user.
        this.feedbackService.showInfoShort('File successfully deleted');

      }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Invoked when a file should be closed.
   * 
   * @param file File to close
   * @param force If true user will not be warned about unsaved changes
   */
  public closeFile(file: FileNode, noDirtyWarnings: boolean = false) {

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
      this.closeFileImpl(file);

    } else {

      // File has been edited, and we need to inform user allowing him to save it.
      this.feedbackService.confirm('File not saved', 'File has unsaved changes, are you sure you want to close the file?', () => {

        // User confirmed he wants to close file, even though the editor is dirty (has changes).
        this.closeFileImpl(file);
      });
    }
  }

  /**
   * Deletes the currently active folder.
   */
  public deleteActiveFolder() {

    // Asking user to confirm action.
    this.feedbackService.confirm('Confirm action', `Are you sure you want to delete the '${this.activeFolder}' folder?`, () => {

      // Invoking backend to actually delete folder.
      this.fileService.deleteFolder(this.activeFolder).subscribe(() => {

        // Showing feedback to user and updating treeview.
        this.removeNode(this.activeFolder);
        this.feedbackService.showInfoShort('Folder successfully deleted');

        // Making sure we remove all files existing within the folder that are currentl edited.
        this.openFiles = this.openFiles.filter(x => !x.path.startsWith(this.activeFolder));

        // Verifying that active file is not one of the files actually removed in above logic.
        if (this.openFiles.filter(x => x.path === this.activeFile).length === 0) {

          // Verifying there are any open files left.
          if (this.openFiles.length > 0) {
            this.activeFile = this.openFiles[0].path;
          } else {
            this.activeFile = null;
          }
        }

        // Databinding tree again.
        this.dataBindTree();

        // Resetting active folder to root folder.
        this.activeFolder = '/';

      }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Invoked when user wants to execute a macro.
   */
  public selectMacro() {

    // Opening modal dialog allowing user to select macro.
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
  }

  /**
   * Invoked when user wants to generate a CRUD app.
   */
  public generateCrudApp() {

    // Opening modal dialog allowing user to generate a CRUD app.
    this.generateCrudDialog = this.dialog.open(GenerateCrudAppComponent, {
      width: '80%',
      disableClose: true
    });

    // Making sure we can still close the dialog when the obscurer is clicked.
    this.generateCrudDialog.backdropClick().subscribe(() => {
      this.generateCrudDialog.close();
    })
  }

  /*
   * Private helper methods.
   */

  /*
   * Executes the specified macro.
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
                  this.root.children = [];
                  this.getFilesFromServer('/', () => {
                    this.getEndpoints();
                  });
                });
            } else if (exeResult.result.startsWith('folders-changed|')) {

              // Macro returned specific folder that we'll need to update, and hence we can update only that folder.
              var fileObject = exeResult.result.split('|')[1];
              this.updateFolder(fileObject);
            }

          }, (error: any) => this.feedbackService.showError(error));

        } else if (result) {

          // Assuming user wants to select another macro.
          this.selectMacro();

        } // Else, do nothing ...
      });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Returns all folders in system to caller.
   */
  private getFolders(current: TreeNode = this.root) {

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
  private getFiles(current: TreeNode = this.root) {

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
        this.cdRef.detectChanges();
        // to hide/show sidenav
        let sidenav = document.querySelector('.mat-sidenav');
        sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
          sidenav.classList.add('d-none');
        this.drawer.close();
        // Toggling maximise mode.
        cm.setOption('fullScreen', !cm.getOption('fullScreen'));
      };

      // Alt+S saves the active file.
      options[0].options.extraKeys['Alt-S'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var activeWrapper = document.querySelector('.active-codemirror-editor');
        if (activeWrapper) {
          var btn = (<any>activeWrapper.querySelector('.save-file-btn'));
          if (btn) {
            btn.click();
          }
        }
      };

      // Alt+D deletes the active file.
      options[0].options.extraKeys['Alt-D'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var activeWrapper = document.querySelector('.active-codemirror-editor');
        if (activeWrapper) {
          var btn = (<any>activeWrapper.querySelector('.delete-file-btn'));
          if (btn) {
            btn.click();
          }
        }
      };

      // Alt+C closes the active file.
      options[0].options.extraKeys['Alt-C'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var activeWrapper = document.querySelector('.active-codemirror-editor');
        if (activeWrapper) {
          var btn = (<any>activeWrapper.querySelector('.close-file-btn'));
          if (btn) {
            btn.click();
          }
        }
      };

      // Alt+R renames the active file.
      options[0].options.extraKeys['Alt-R'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var activeWrapper = document.querySelector('.active-codemirror-editor');
        if (activeWrapper) {
          var btn = (<any>activeWrapper.querySelector('.rename-file-btn'));
          if (btn) {
            btn.click();
          }
        }
      };

      // Alt+O opens up the select macro window.
      options[0].options.extraKeys['Alt-O'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var btn = <any>document.querySelector('.new-macro-object-btn');
        if (btn) {
          btn.click();
        }
      };

      // Alt+N opens up create new file object dialog.
      options[0].options.extraKeys['Alt-A'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var btn = <any>document.querySelector('.new-file-object-btn');
        if (btn) {
          if (btn) {
            btn.click();
          }
        }
      };

      // Alt+X deletes currently selected folder.
      options[0].options.extraKeys['Alt-X'] = (cm: any) => {

        // Retrieving active CodeMirror editor to check if its document is dirty or not.
        var btn = <any>document.querySelector('.delete-folder-btn');
        if (btn) {
          if (btn) {
            btn.click();
          }
        }
      };
    }
    return options[0].options;
  }

  /*
   * Actual method responsible for closing file.
   */
  private closeFileImpl(file: FileNode) {
    this.cdRef.markForCheck();
    // Removing file from edited files.
    let idx: number;
    this.openFiles.forEach(element => {
      if (element.path === file.path) {
        idx = this.openFiles.indexOf(element);
      }
    });
    this.openFiles.splice(idx, 1);

    if (this.openFiles.length === 0) {
      this.activeFile = null;
    } else {
      if (idx === 0) {
        this.activeFile = this.openFiles[0].path;
      } else {
        this.activeFile = this.openFiles[idx - 1].path;
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
  private getEndpoints(onAfter: () => void = null) {

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
   * Updates the specified folder (only) and re-renders TreeView.
   */
  private updateFolder(fileObject: string) {

    // Figuring out folder to refresh, since fileObject might be a file or a folder.
    var folder = fileObject;
    var isFile = false;
    if (!fileObject.endsWith('/')) {

      // File object is a file.
      folder = folder.substr(0, folder.lastIndexOf('/') + 1);
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
        this.activeFile = fileObject;
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

  /*
   * Returns an endpoint matching the specified file node, or null if file cannot
   * be matched to an endpoint.
   */
  protected getEndpoint(file: FileNode) {

    // Notice, only files inside of "/modules/" and "/system/" can be endpoint files.
    if (file.path.startsWith('/modules/') || file.path.startsWith('/system/')) {

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
   * Uploads one or more files to the currently active folder.
   */
  public upload(files: FileList, path: string = this.activeFile, node: TreeNode = this.root) {
    
    // Iterating through each file and uploading one file at the time.
    for (let idx = 0; idx < files.length; idx++) {

      // Invoking service method responsible for actually uploading file.
      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe(() => {

        // Showing some feedback to user, and re-databinding folder's content.
        this.feedbackService.showInfo('File was successfully uploaded');
        this.fileInput = null;
        this.updateFolder(this.activeFolder);

      });
    }
  }

  /**
   * Invoked when user wants to download a file directly to server.
   * @param type - folder or file
   */
  public downloadFileToServer(type: string) {

    // if folder is selected
    if (this.activeFolder && type === 'folder') {
      // Downloading folder.
      this.fileService.downloadFolder(this.activeFolder);
    } else
      // making sure a file is selected
      if (this.activeFile && type === 'file') {
        // Downloading file.
        this.fileService.downloadFile(this.activeFile);
      }
  }

  /**
   * Returns true if given path is a folder
   * 
   * @param path What path to check
   */
  public isFolder(path: string) {
    return path.endsWith('/');
  }

  public uploadZipFile(file: FileList){
    if (file[0].name.split('.')[1] === 'zip'){
      this.fileService.uploadZipFile(file.item(0)).subscribe(() => {
        
        // Showing some feedback to user, and re-databinding folder's content.
        this.feedbackService.showInfo('File was successfully uploaded');
        this.zipFileInput = null;
        this.updateFolder('/modules/');
        
      });
    } else {
      this.feedbackService.showInfo('Only .zip is acceptable');
    }
  }

  public toggleSystemFiles(){
    console.log(this.systemFiles, 'toggling system files works!')
  }
}
