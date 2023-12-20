
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

// Application specific imports
import { FlatNode } from './models/flat-node.model';
import { TreeNode } from './models/tree-node.model';
import { FileNode } from '../../models/file-node.model';
import { FileService } from 'src/app/services/file.service';
import { GeneralService } from 'src/app/services/general.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MagicResponse } from 'src/app/models/magic-response.model';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';
import { ConfirmationDialogComponent } from 'src/app/components/protected/common/confirmation-dialog/confirmation-dialog.component';
import { NewFileFolderDialogComponent } from 'src/app/components/protected/create/hyper-ide/components/new-file-folder-dialog/new-file-folder-dialog.component';
import { IncompatibleFileDialogComponent } from 'src/app/components/protected/create/hyper-ide/components/incompatible-file-dialog/incompatible-file-dialog.component';
import { ParametriseActionDialog } from '../parametrise-action-dialog/parametrise-action-dialog.component';

/**
 * Tree component for Hyper IDE displaying files and folders, allowing user
 * to select and open files, and/or switch to open file, rename file, or close open files.
 */
@Component({
  selector: 'app-ide-tree',
  templateUrl: './ide-tree.component.html',
  styleUrls: ['./ide-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdeTreeComponent implements OnInit {

  private root: TreeNode = {
    name: '',
    path: '/',
    isFolder: true,
    children: [],
    level: 0,
    systemFile: false,
  };

  @Input() searchKey: string;
  @Output() showEditor: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEditorHistory: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() setFocusToActiveEditor: EventEmitter<any> = new EventEmitter<any>();

  systemFiles: boolean = false;
  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  dataSource = new MatTreeFlatDataSource(this.treeControl, treeFlattener);
  openFiles: FileNode[] = [];
  currentFileData: FileNode;
  activeFolder: string = '/';
  fileInput: string;
  zipFileInput: string;
  showRenameBox: TreeNode = null;
  currentSelection: string = '';
  workflowFunctions: any[] = [];

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private workflowService: WorkflowService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    // Retrieving files from server, and data binding tree to its initial state.
    this.generalService.showLoading();
    this.getFilesFromServer().then((res: boolean) => {

      // Making sure we succeeded in getting files from backend.
      if (res === true) {

        // Data binding tree.
        this.dataSource.data = this.root.children;

        this.getToolboxItemsFromServer().then(() => {

          this.generalService.hideLoading();
        })
      }
    });
  }

  /**
   * Returns true if currently open file is a Hyperlambda file.
   */
  isHyperlambdaFile() {

    return this.currentFileData?.path?.endsWith('.hl') || false;
  }

  /**
   * Retrieves files and folders from backend.
   */
  getFilesFromServer(folder: string = '/') {

    return new Promise<boolean>(resolve => {

      // Helper function to insert files and folders correctly into TreeNode hierarchy.
      const addToRoot = (objects: string[], isFolder: boolean) => {
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
            systemFile: this.isSystemPath(idx),
          });
        }
      }

      // Getting folders recursively.
      this.fileService.listFoldersRecursively(folder, this.systemFiles).subscribe({

        next: (folders: string[]) => {

          addToRoot(folders || [], true);

          // Getting files recursively.
          this.fileService.listFilesRecursively(folder, this.systemFiles).subscribe({
            next: (files: string[]) => {

              addToRoot(files || [], false);
              resolve(true);
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
          });
        },
        error: (error: any) => {

          resolve(false);
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    });
  }

  /**
   * Returns all toolbox items from the server.
   */
  getToolboxItemsFromServer() {

    return new Promise<boolean>(resolve => {

      this.workflowService.listToolboxItems().subscribe({

        next: (functions: any[]) => {

          this.workflowFunctions = functions.reverse();
          resolve(true);
        },

        error: (error: any) => {

          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          resolve(false);
        }
      });
    });
  }

  /**
   * Adds the specified function to the currently edited workflow.
   */
  insertToolboxItem(el: any) {

    // Retrieving editor instance.
    const fileExisting: number = this.openFiles.findIndex((item: any) => item.path === this.currentFileData.path);
    const activeWrapper = document.querySelector('.active-codemirror-editor-' + fileExisting);
    const editor = (<any>activeWrapper.querySelector('.CodeMirror')).CodeMirror;

    // Making sure we're in a position where we can insert Hyperlambda.
    const sel = editor.doc.sel.ranges[0];
    if (sel.anchor.ch % 3 !== 0) {

      this.generalService.showFeedback('You cannot insert Hyperlambda at the caret\'s current position since it would produce invalid Hyperlambda', 'errorMessage');
      editor.focus();
      return;
    }

    // Checking if this is a simple snippet insert.
    if (el.action === false) {

      // Simple snippet insert.
      this.insertToolboxItemImplementation(editor, sel, el);

    } else {

      // Action insert.
      this.workflowService.getArguments(el.filename).subscribe({

        next: (result: any) => {

          this.dialog.open(ParametriseActionDialog, {
            width: '750px',
            maxWidth: '80vw',
            disableClose: true,
            data: {
              input: result.input,
            },
          }).afterClosed().subscribe((data: any) => {
            if (data) {
              this.insertToolboxItemImplementation(editor, sel, el, data);
            }
          });
        },

        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    }
  }

  /**
   * Invoked when user wants to open a file for editing.
   */
  openFile(file: TreeNode) {

    // Checking if file is already open.
    const alreadyOpen = this.openFiles.filter(x => x.path === file.path).pop();
    if (alreadyOpen) {

      // File is already open.
      this.currentFileData = alreadyOpen;
      this.showEditor.emit({
        currentFileData: this.currentFileData
      });

    } else {

      // File is not open from before.
      const cmOptions = this.getCodeMirrorOptions(file.path);
      if (cmOptions === null) {

        // No registered editor for file, asking user what to do with file.
        const dialog = this.dialog.open(IncompatibleFileDialogComponent, {
          width: '550px',
          data: {
            name: file.name,
          },
        });
        dialog.afterClosed().subscribe((data: { deleteFile: false, download: false, unzip: false }) => {

          if (data && data.download) {

            // Downloading file.
            this.downloadActiveFile(file.path);

          } else if (data && data.deleteFile) {

            // Deleting file.
            this.deleteFile(file.path, false);

          } else if (data && data.unzip) {

            // Unzipping file.
            this.fileService.unzip(file.path).subscribe({
              next: () => {

                // Updating parent folder since unzip operation highly likely produced additional files and/or folder for us.
                this.updateFileObject(TreeNode.parentFolder(file));
              },
              error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            });
          }
        });
        return;
      }

      // File type has a registered CodeMirror editor.
      this.fileService.loadFile(file.path).subscribe({
        next: (content: string) => {
          this.openFiles.push({
            name: file.name,
            path: file.path,
            folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
            content: content,
            options: cmOptions,
          });

          this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
          this.showEditor.emit({ currentFileData: this.currentFileData })

          // Hack to make sure initial loading of file does not become an "undo" operation.
          setTimeout(() => {
            this.scrollToLastOpenFile();
            this.clearEditorHistory.emit(true);
          }, 1);

        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }

    // When a file is opened, we set the active folder to the file's parent folder.
    this.activeFolder = TreeNode.parentFolder(file);
  }

  /**
   * Deletes currently activated and open file.
   */
  deleteActiveFile() {
    this.deleteFile(this.currentFileData.path);
  }

  /**
   * Deletes the specified file, optionally asking user to confirm action.
   */
  deleteFile(path: string, askForConfirmation: boolean = true) {

    // Callback invoked when file should be deleted.
    const deleteFileImplementation = () => {

      this.fileService.deleteFile(path).subscribe({
        next: () => {

          // Updating parent folder.
          this.updateFileObject(TreeNode.parentFolderFromPath(path));
    
          // Making sure we close file if it's currently open.
          if (this.currentFileData?.path === path) {
            this.closeFile(path);
          }
    
          // Making sure we remove file from list of open files.
          const open = this.openFiles.findIndex(x => x.path === path);
          if (open !== -1) {
            this.openFiles.splice(open, 1);
          }

          // Providing feedback to user.
          this.generalService.showFeedback('File was deleted successfully', 'successMessage');

        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    };

    if (askForConfirmation === false) {

      // Deleting file immediately without asking for confirmation.
      deleteFileImplementation();

    } else {

      // Asking user to confirm action.
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: 'Confirm operation',
          description_extra: `This operation is permanent, please confirm you wish to delete;<br/><span class="fw-bold">${path}</span>`,
          action_btn: 'Delete',
          action_btn_color: 'warn',
          bold_description: true
        }
      }).afterClosed().subscribe((result: string) => {

        if (result === 'confirm') {

          deleteFileImplementation();
        }
      });
    }
  }

  /**
   * Deletes currently activated folder.
   */
  deleteActiveFolder() {
    this.deleteFolder(this.activeFolder);
  }

  /**
   * Deletes the specified folder.
   */
  deleteFolder(path: string) {

    // Making sure user doesn't delete system folders.
    if (this.isSystemFolder(path)) {
      this.generalService.showFeedback('You cannot delete system folders', 'errorMessage', 'Ok', 3000);
      return;
    }

    // Asking user to confirm action.
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete entire folder`,
        description_extra: `You are deleting the following folder: <br/> <span class="fw-bold">${path}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        // Deleting folder on server.
        this.fileService.deleteFolder(path).subscribe({

          next: () => {

            // Updating parent folder.
            this.updateFileObject(TreeNode.parentFolderFromPath(path));

            // Making sure we turn parent folder to currently active folder.
            this.activeFolder = TreeNode.parentFolderFromPath(path);

            // Checking if currently active open file is inside of deleted folder.
            if (this.currentFileData?.folder.startsWith(path)) {
              this.closeFile(this.currentFileData.path);
            }

            // Databinding tree again now that folder has been removed.
            this.dataBindTree();

            // Showing feedback to user.
            this.generalService.showFeedback('Folder successfully deleted', 'successMessage');

          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  /**
   * Data bind the tree, such that folders that are already expanded stays expanded
   * after data binding is done.
   */
  dataBindTree() {

    // Storing currently expanded nodes such that we can re-expand them after data binding.
    const expanded: FlatNode[] = [];
    for (const idx of this.treeControl.dataNodes) {
      if (this.treeControl.isExpanded(idx)) {
        expanded.push(idx);
      }
    }

    // Updating data source.
    this.dataSource.data = this.root.children;

    // Expanding folders that were previously expanded.
    for (const idx of this.treeControl.dataNodes) {
      if (expanded.filter(x => (<any>x)?.node?.path === (<any>idx).node.path).length > 0) {
        this.treeControl.expand(idx);
      }
    }
  }

  /**
   * Closes the specified file.
   */
  closeFile(path: string) {

    // Removing file from currently open files.
    this.openFiles = this.openFiles.filter(x => x.path !== path);

    // Checking if file that's being closed is currently activated open file.
    if (this.currentFileData.path !== path) {
      return;
    }

    // Trying our best to open another file.
    this.currentFileData = this.openFiles.length > 0 ? this.openFiles[this.openFiles.length - 1] : null;
    this.scrollToLastOpenFile();

    // Signaling other components to let them know active file was changed.
    this.showEditor.emit({ currentFileData: this.currentFileData })
    this.setFocusToActiveEditor.emit();
  }

  /**
   * Shows the in place rename textbox.
   */
  showRenameInput(node: TreeNode) {

    // Making sure we display renaming textbox for specified tree node.
    this.showRenameBox = node;

    // Making sure input element is given focus.
    setTimeout(() => {
      (document.querySelector('#renameFile') as HTMLElement).focus();
    }, 10);
  }

  /**
   * Renames the specified file to its new name.
   */
  renameFile(event: { file: { path: string, name: string }, newName: string }) {

    // Sanity checking new name.
    if (!this.nameValidation(event.newName)) {
      this.generalService.showFeedback(`${event.newName} is not an aceptable filename`);
      return;
    }

    // Checking if name is the same at which point we return early.
    if (event.file.name === event.newName) {
      this.showRenameBox = null;
      return; // Name didn't change.
    }

    // Renaming file on server.
    this.fileService.rename(event.file.path, event.newName).subscribe({
      next: () => {

        // Finding tree node reference.
        const treeNode = this.findTreeNodeFolder(this.root, event.file.path);

        // Finding file amongst open files.
        const openRef = this.openFiles.filter(x => x.path == event.file.path).pop();

        // Figuring out new path of file.
        const newPath = event.file.path.substring(0, event.file.path.lastIndexOf('/') + 1) + event.newName;

        // Checking if file is open, at which point we need to modify reference.
        if (openRef) {

          // Updating reference to currently open file.
          openRef.path = newPath;
          openRef.name = event.newName;

          // Checking if renamed file is currently activated file, and if so changing it to reflect its new path.
          if (this.currentFileData?.path === event.file.path) {

            // Updating name and path.
            this.currentFileData.path = newPath;
            this.currentFileData.name = event.newName;

            // Signaling other components.
            this.showEditor.emit({
              currentFileData: this.currentFileData
            });
          }
        }

        // Updating tree node.
        treeNode.name = event.newName;
        treeNode.path = newPath;

        // Data binding tree again, the node name changed.
        this.dataBindTree();

        // Hiding rename textbox.
        this.showRenameBox = null;

        // Showing feedback to user.
        this.generalService.showFeedback('File successfully renamed', 'successMessage');

      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Renames the specified folder to its new name.
   */
  renameFolder(event: { folder: string, newName: string }) {

    // Sanity checking new name.
    if (!this.nameValidation(event.newName)) {
      this.generalService.showFeedback('Invalid characters', 'errorMessage');
      return;
    }

    // Figuring out new folder path after renaming.
    const newFolderPath = TreeNode.parentFolderFromPath(event.folder) + event.newName + '/';

    // Checking if name is the same at which point we return early.
    if (newFolderPath === event.folder) {
      this.showRenameBox = null;
      return; // Name didn't change.
    }

    // Renaming folder on server.
    this.fileService.rename(event.folder, newFolderPath).subscribe({
      next: () => {

        // Looping through all open files that are within renamed folder.
        for (const idxOpen of this.openFiles.filter(x => x.folder.startsWith(event.folder))) {
          idxOpen.folder = newFolderPath + idxOpen.folder.substring(event.folder.length);
          idxOpen.path = newFolderPath + idxOpen.path.substring(event.folder.length);
        }

        // Updating active folder, if it's affected by renaming process.
        if (this.activeFolder.startsWith(event.folder)) {
          this.activeFolder = newFolderPath + this.activeFolder.substring(event.folder.length);
        }

        // Hiding rename textbox.
        this.showRenameBox = null;

        // Updating folder.
        this.updateFileObject(TreeNode.parentFolderFromPath(event.folder));

        // Showing feedback to user.
        this.generalService.showFeedback('Folder successfully renamed', 'successMessage');
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  createNewFileObject(type: string) {
    const folders = this.getFolders();
    const files = this.getFiles();
    const dialogRef = this.dialog.open(NewFileFolderDialogComponent, {
      width: '550px',
      data: {
        isFolder: (type === 'folder'),
        name: '',
        path: this.activeFolder,
        folders: folders,
        files: files,
        type: type
      },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        let path = result.path + result.name;

        if (type === 'folder') {
          path += '/';
          this.fileService.createFolder(path).subscribe({
            next: () => {
              this.generalService.showFeedback('Folder successfully created', 'successMessage');
              this.sort({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          });
        } else {
          this.fileService.saveFile(path, result.template ?? '').subscribe({
            next: () => {
              this.generalService.showFeedback('File successfully created', 'successMessage');
              this.sort({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          });
        }
      }
    });
  }

  downloadActiveFile(path?: string) {

    if (!path && this.currentFileData) {
      this.fileService.downloadFile(this.currentFileData.path);
    }
    if (path) {
      this.fileService.downloadFile(path);
    }
  }

  downloadFolder() {

    if (this.activeFolder) {
      this.fileService.downloadFolder(this.activeFolder);
    }
  }

  selectFolder(folder: FlatNode) {

    this.activeFolder = folder.node.path;
  }

  uploadFiles(files: FileList) {

    this.generalService.showLoading();

    for (let idx = 0; idx < files.length; idx++) {

      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe({

        next: () => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('File was successfully uploaded', 'successMessage');
          this.fileInput = null;
          if (idx === (files.length - 1)) {
            this.updateFileObject(this.activeFolder);
          }
        },

        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    };
  }

  updateFileObject(fileObject: string) {

    let folder = fileObject;
    let isFile = false;
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

    this.generalService.showLoading();
    this.getFilesFromServer(folder).then((success: any) => {
      if (success) {
        if (isFile) {
          this.fileService.loadFile(fileObject).subscribe({
            next: async (content: string) => {

              this.generalService.hideLoading();

              if (this.getCodeMirrorOptions(fileObject) !== null) {
                this.openFiles.push({
                  name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                  path: fileObject,
                  folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
                  content: content,
                  options: this.getCodeMirrorOptions(fileObject),
                });
                this.currentFileData = this.openFiles.filter(x => x.path === fileObject)[0];
                this.showEditor.emit({ currentFileData: this.currentFileData });
                this.setFocusToActiveEditor.emit();
              }

              // If the code mirror can't open the file.
              // Lets the user decide what to do with it.
              if (this.getCodeMirrorOptions(fileObject) === null) {
                this.dialog.open(IncompatibleFileDialogComponent, {
                  width: '550px',
                  data: {
                    name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                  },
                }).afterClosed().subscribe(async (data: { deleteFile: false, download: false }) => {
                  const objectToDelete: any = {
                    name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                    path: fileObject,
                    folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
                    content: content,
                    options: this.getCodeMirrorOptions(fileObject)
                  }
                  if (data && data.download) {
                    this.downloadActiveFile(fileObject);
                  } else if (data && data.deleteFile) {
                    this.deleteFile(objectToDelete, false);
                  }
                });
                return;
              }
            },
            error: (error: any) => {

              this.generalService.hideLoading();
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            }
          })
        } else {

          this.dataBindTree();
          this.generalService.hideLoading();
        }
      } else {
        this.generalService.hideLoading();
      }
    });
  }

  isExpandable(_: number, node: FlatNode) {

    return node.expandable;
  }

  filterLeafNode(node: FlatNode, searchKeyword: string) {

    if (!searchKeyword) {
      return false
    }
    return node.node.path.toLowerCase().indexOf(searchKeyword?.toLowerCase()) === -1
  }

  filterParentNode(node: FlatNode, searchKeyword: string) {

    if (!searchKeyword || node.node.path.toLowerCase().indexOf(searchKeyword?.toLowerCase()) !== -1) {
      return false
    }
    const descendants = this.treeControl.getDescendants(node)

    if (descendants.some((descendantNode) => descendantNode.node.path.toLowerCase().indexOf(searchKeyword?.toLowerCase()) !== -1)) {
      return false
    }
    return true
  }

  filterToolbox(item: any, searchKeyword: string) {

    return searchKeyword &&
      searchKeyword !== '' &&
      !item.name.toLowerCase().includes(searchKeyword.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchKeyword.toLowerCase()) &&
      (!item.content?.toLowerCase().includes(searchKeyword.toLowerCase()) || false);
  }

  getTooltipClass(el: any) {

    return el.content ? 'pre-tooltip' : '';
  }

  getToolboxTooltip(item: any) {

    return item.content ?? item.description;
  }

  installModule(file: FileList) {

    if (file[0].name.split('.')[1] === 'zip') {

      this.generalService.showLoading();
      this.fileService.installModule(file.item(0)).subscribe({
        next: () => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('File was successfully uploaded', 'successMessage');
          this.zipFileInput = null;
          this.updateFileObject('/modules/');
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error);
        }
      });
    } else {
      this.generalService.showFeedback('Only zip files without . are accepted', 'errorMessage', 'Ok', 5000);
    }
  }

  /*
   * Private helper methods.
   */

  private getFolders(current: any = this.root) {

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

  private getFiles(current: any = this.root) {

    let result: string[] = [];
    for (const idx of current.children.filter(x => !x.isFolder)) {
      result.push(idx.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      result = result.concat(this.getFiles(idx));
    }
    return result;
  }

  private sort(event: any) {

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
        systemFile: this.isSystemPath(event.objectPath),
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
        systemFile: this.isSystemPath(event.objectPath),
      });

      sorter();
      this.dataBindTree();
      this.updateFileObject(event.objectPath);
    }
  }

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

  private nameValidation(name: string) {

    if (!name || name.length === 0) {
      return false;
    }
    for (const idx of name) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }
    return true
  }

  private getCodeMirrorOptions(path: string) {

    return this.codemirrorActionsService.getActions(path);
  }

  private scrollToLastOpenFile() {

    const el = document.getElementById('active');
    if (el)
      el.scrollIntoView();
  }

  private isSystemPath(path: string) {

    return path.startsWith('/system/') ||
      path.startsWith('/misc/') ||
      path.startsWith('/data/') ||
      path.startsWith('/config/');
  }

  private isSystemFolder(path: string) {

    return path === '/' ||
      path === '/system/' ||
      path === '/modules/' ||
      path === '/data/' ||
      path === '/config/' ||
      path === '/etc/';
  }

  private insertToolboxItemImplementation(editor: any, sel: any, el: any, args: any = null) {

    this.generalService.showLoading();
    this.workflowService.getHyperlambda(el.filename, args).subscribe({

      next: (result: MagicResponse) => {

        this.generalService.hideLoading();
        let hl = result.result.split('\r\n');
        let sp = '';
        for (let idxNo = 0; idxNo < sel.anchor.ch; idxNo++) {
          sp += ' ';
        }
        editor.replaceSelection(hl.map(x => sp + x).join('\r\n'));
        editor.changeGeneration(true);
        editor.focus();
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}

// Transforms from internal data structure to tree control's expectations.
const _transformer = (node: TreeNode, level: number) => {

  return {
    expandable: node.isFolder,
    name: node.name,
    level: level,
    node: node,
  };
};

const treeFlattener = new MatTreeFlattener(_transformer, node => node.level, node => node.expandable, node => node.children);