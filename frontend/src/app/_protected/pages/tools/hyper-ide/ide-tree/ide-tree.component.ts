import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { Observable, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { EndpointsGeneralService } from 'src/app/_general/services/endpoints-general.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Endpoint } from '../../../administration/generated-endpoints/_models/endpoint.model';
import { IncompatibleFileDialogComponent } from '../../../administration/generated-frontend/components/incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../../../administration/generated-frontend/components/new-file-folder-dialog/new-file-folder-dialog.component';
import { FileNode } from '../_models/file-node.model';
import { FlatNode } from '../_models/flat-node.model';
import { TreeNode } from '../_models/tree-node.model';
import { CodemirrorActionsService } from '../_services/codemirror-actions.service';
import { FileService } from '../_services/file.service';

@Component({
  selector: 'app-ide-tree',
  templateUrl: './ide-tree.component.html',
  styleUrls: ['./ide-tree.component.scss']
})
export class IdeTreeComponent implements OnInit, OnDestroy {

  @Input() searchKey!: Observable<string>;

  @Output() showEditor: EventEmitter<any> = new EventEmitter<any>();
  @Output() setFocusToActiveEditor: EventEmitter<any> = new EventEmitter<any>();

  // Flattens tree structure.
  private treeFlattener = new MatTreeFlattener(_transformer, node => node.level, node => node.expandable, node => node.children);

  /**
   * Actual tree control for component.
   */
  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);

  /**
   * Actual data source for tree control.
   */
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  private endpointSubscription!: Subscription;

  // Model describing endpoints in your installation.
  private endpoints: Endpoint[];

  /**
   * Currently edited files.
   */
  openFiles: FileNode[] = [];

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
   * Currently open folder
   */
  openFolder: any;

  /**
   * boolean:: system files sliding value
   * if true, all files will be displayed
   * default value is false.
   */
  systemFiles: boolean = false;

  /**
   * Model for file uploader.
   */
   fileInput: string[];
   zipFileInput: any;

  public showRenameBox: any = null;

  public currentSelection: string = '';

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private fileService: FileService,
    private generalService: GeneralService,
    private endpointsGeneralService: EndpointsGeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit(): void {
    this.getFilesFromServer().then((res: boolean) => {
      if (res === true) {
        this.getEndpoints();
        this.refetchEndpointsList();
      }
    })
  }

  /**
   * Fetching list of endpoints to be used throughout the app.
   * Only invokes when requesting a refrech of the list.
   */
  public refetchEndpointsList() {
    this.endpointsGeneralService.getEndpoints();
  }

  /**
   * Reading endpoints' list from the already fetched instance.
   */
  private getEndpoints() {
    this.endpointSubscription = this.endpointsGeneralService.endpoints.subscribe({
      next: (endpoints: Endpoint[]) => {
        this.endpoints = endpoints;
        this.cdr.detectChanges();
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /**
   * Invoked when files needs to be fetched from the server.
   */
  public getFilesFromServer(folder: string = '/') {
    return new Promise(resolve => {
      const functor = (objects: string[], isFolder: boolean) => {
        for (const idx of objects) {
          const entities = idx.split('/').filter(x => x !== '');
          let parent = root;
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
      }

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
                  name1.push(root.children.filter(newData => !this.dataSource.data.map(oldData => oldData.name).includes(newData.name)));
                }

                this.dataSource.data = root.children;

                // if file system is enabled, then set a new field as systemFile to true
                if (this.systemFiles) {
                  this.dataSource.data.map(x => name1[0].forEach((element: any) => {
                    if (x.name === element.name) {
                      x['systemFile'] = true;
                    }
                  }))
                }

                console.log(this.dataSource.data)
              } else {
                // this.dataBindTree();
              }

              resolve(true);
              this.cdr.detectChanges();
            },
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
          });
        },
        error: (error: any) => {
          resolve(false)
          this.generalService.showFeedback(error, 'errorMessage')
        }
      });
    })
  }

  /**
   * Invoked when user wants to open a file.
   *
   * @param file Tree node wrapping file to open
   */
  public async openFile(file: TreeNode) {
    if (this.openFiles.filter(x => x.path === file.path).length > 0) {
      this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
      // this.setFocusToActiveEditor();
      this.showEditor.emit({ currentFileData: this.currentFileData })
    } else {
      if (await this.getCodeMirrorOptions(file.path) === null) {
        const dialog = this.dialog.open(IncompatibleFileDialogComponent, {
          width: '550px',
          data: {
            name: file.name,
          },
        });
        dialog.afterClosed().subscribe((data: { deleteFile: false, download: false, unzip: false }) => {
          if (data && data.download) {
            this.downloadActiveFile(file.path);
          } else if (data && data.deleteFile) {
            this.deleteActiveFile(file, true);
          } else if (data && data.unzip) {
            this.fileService.unzip(file.path).subscribe({
              next: () => {
                const update = file.path.substring(0, file.path.lastIndexOf('/') + 1);
                this.updateFileObject(update);
              },
              error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
            });
          }
        });
        return;
      }
      this.fileService.loadFile(file.path).subscribe({
        next: async (content: string) => {
          this.openFiles.push({
            name: file.name,
            path: file.path,
            folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
            content: content,
            options: await this.getCodeMirrorOptions(file.path),
          });

          this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
          this.showEditor.emit({ currentFileData: this.currentFileData })
          this.cdr.detectChanges();
          setTimeout(() => {
            this.scrollToLastOpenFile();
          }, 1);
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
      });
    }
    this.activeFolder = file.path.substring(0, file.path.lastIndexOf('/') + 1);
  }

  /**
   * Invoked when a file should be deleted.
   *
   * @callback deleteActiveFileFromParent calling a function in the parent component for managing the tree
   */
  public deleteActiveFile(file: any, noConfirmation?: boolean) {
    if (noConfirmation === true) {
      const folderPath: string = file.path.toString().replace(file.name, '');
      this.fileService.deleteFile(file.path).subscribe({
        next: (res: { result: string }) => {
          if (res.result === 'success') {
            this.updateFileObject(folderPath);
            this.closeFileImpl();
            this.generalService.showFeedback('File is deleted successfully.', 'successMessage');
          } else {
            this.generalService.showFeedback('Something went wrong, please try again.', 'errorMessage')
          }
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
      });
    } else {
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Delete ${file.name}`,
          description_extra: 'You are deleting the selected file. Do you want to continue?',
          action_btn: 'Delete',
          action_btn_color: 'warn',
          bold_description: true
        }
      }).afterClosed().subscribe((result: string) => {
        if (result === 'confirm') {
          const folderPath: string = file.node.path.toString().replace(file.name, '');
          this.fileService.deleteFile(file.node.path).subscribe({
            next: (res: { result: string }) => {
              if (res.result === 'success') {
                this.updateFileObject(folderPath);
                this.closeFileImpl();
                this.generalService.showFeedback('File is deleted successfully.', 'successMessage');
              } else {
                this.generalService.showFeedback('Something went wrong, please try again.', 'errorMessage')
              }
            },
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
          });
        }
      })
    }
  }

  /**
   * Invoked when a file should be deleted.
   *
   * @callback closeFileImpl to close the active file if it's from the same folder.
   * @callback removeNode To remove the node after successful deletion.
   * @callback dataBindTree To rebind the tree after changes.
   */
   public deleteActiveFolder(folder: any) {
    let path: string = '';
    folder.node ? path = folder.node.path : path = folder;
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
        if (this.currentFileData?.folder.indexOf(path) > -1) {
          this.closeFileImpl();
        }
         this.fileService.deleteFolder(path).subscribe({
           next: (res: { result: string }) => {
             if (res.result === 'success') {
              this.removeNode(path);
               this.generalService.showFeedback('Folder is deleted successfully.', 'successMessage');

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
                this.cdr.detectChanges();
             } else {
               this.generalService.showFeedback('Something went wrong, please try again.', 'errorMessage')
             }
           },
           error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
         });
       }
     })
  }

  /*
   * Invoked when a node should be removed from tree node collection.
   */
  private removeNode(path: string, node: TreeNode = root) {
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
   * Returns options for CodeMirror editor.
   */
  private getCodeMirrorOptions(path: string): Promise<any> {
    return this.codemirrorActionsService.getActions(path).then((res: any) => { return res });
  }

  /**
   * Scroll to the last file.
   */
  private scrollToLastOpenFile() {
    const el = document.getElementById('active');
    if (el)
      el.scrollIntoView();
  }

  /*
   * Databinds tree control such that expanded items stays expanded.
   */
  public dataBindTree() {
    const expanded: FlatNode[] = [];
    for (const idx of this.treeControl.dataNodes) {
      if (this.treeControl.isExpanded(idx)) {
        expanded.push(idx);
        expanded.push(this.openFolder);
      }
    }
    // root.children.map((root_folder: any) => {

    //   if (root_folder.name === 'etc') {

    //     root_folder.children = root_folder.children.filter((item: any) => item.path !== '/etc/frontend/');
    //   }
    // })
    this.dataSource.data = root.children;

    for (const idx of this.treeControl.dataNodes) {
      if (expanded.filter(x => (<any>x)?.node?.path === (<any>idx).node.path).length > 0) {
        this.treeControl.expand(idx);
      }
    }
  }

  /**
     * Actual method responsible for closing file.
     */
  public closeFileImpl() {
    this.cdr.markForCheck();
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
    this.showEditor.emit({ currentFileData: this.currentFileData })
    this.setFocusToActiveEditor.emit();
    this.cdr.detectChanges();
  }

  /**
   * Toggles the rename input field and sets focus on the input.
   * @param item either file or folder
   */
  public showRenameInput(item: any) {
    this.showRenameBox = item;
    setTimeout(() => {
      (document.querySelector('#renameFile') as HTMLElement).focus();
    }, 10);
  }

  /**
   * Invokes endpoint to rename the selected file.
   * @param file Selected file to be renamed.
   * @param name New name to be replaced with the current one.
   * @returns nothing, if the new name and the current one are identical.
   * @callback dataBindTree To rebind the tree with the selected file having a new name.
   * @callback refetchEndpointsList To refetch the list of endpoint and update it throughout the project.
   */
  public renameActiveFile(event: { file: any, name: string }) {
    let path: string = '';
    event.file.node ? path = event.file.node.path : path = event.file.path;
    if (event.name !== '' && event.name !== event.file.name && this.nameValidation(event.name)) {
      this.fileService.rename(path, event.name).subscribe({
        next: () => {
          const treeNode = this.findTreeNodeFolder(root, path);
          treeNode.name = event.name;
          treeNode.path = path.substring(0, path.lastIndexOf('/') + 1) + event.name;
          event.file.name = treeNode.name;
          path = treeNode.path;
          event.file.node && this.currentFileData ? this.currentFileData.path = path : '';
          this.dataBindTree();
          this.cdr.detectChanges();
          this.generalService.showFeedback('File successfully renamed', 'successMessage');
          this.refetchEndpointsList();
          this.showRenameBox = null;

        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
      })
    } else if (!this.nameValidation(event.name)) {
      this.generalService.showFeedback('Invalid characters', 'errorMessage');
    } else {
      this.showRenameBox = null;
      return;
    }
  }

  /**
   * Invokes endpoint to rename the selected folder.
   * @param folder Selected folder to be renamed.
   * @param name New name to be replaced with the current one.
   * @returns nothing, if the new name and the current one are identical.
   * @callback dataBindTree To rebind the tree with the selected folder having a new name.
   * @callback refetchEndpointsList To refetch the list of endpoint and update it throughout the project.
   */
  public renameActiveFolder(folder: any, name?: string) {
    let givenName: string;
    name !== undefined ? givenName = name : givenName = folder.newName;

    if (givenName !== '' && givenName !== folder.name && this.nameValidation(givenName)) {
      const newName = folder.node.path.toString().replace(folder.name, givenName);
      this.fileService.rename(folder.node.path, newName).subscribe({
        next: () => {
          var toUpdate = folder.node.path.substring(0, folder.node.path.length - 1);
          toUpdate = toUpdate.substring(0, toUpdate.lastIndexOf('/') + 1);
          if(this.currentFileData) {
            this.currentFileData.path = this.currentFileData.path.toString().replace(folder.name, givenName);
            this.currentFileData.folder = this.currentFileData.path.toString().replace(folder.name, givenName);
          }

          this.updateFileObject(toUpdate);
          this.cdr.detectChanges();
          this.generalService.showFeedback('Folder successfully renamed', 'successMessage');
          this.showRenameBox = null;
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
      })

    } else if (!this.nameValidation(givenName)) {
      this.generalService.showFeedback('Invalid characters', 'errorMessage');
    } else {
      this.showRenameBox = null;
      return;
    }
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
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')});
        } else {
          this.fileService.saveFile(path, '').subscribe({
            next: () => {
              this.generalService.showFeedback('File successfully created', 'successMessage');
              this.sort({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')});
        }
      }
    });
  }

  /**
   * Downloads the active file or optionally the given file to the client
   *
   * @param path Optional override of which file to actually download
   */
  public downloadActiveFile(path?: string) {
    if (!path && this.currentFileData) {
      this.fileService.downloadFile(this.currentFileData.path);
    }
    if (path) {
      this.fileService.downloadFile(path);
    }
  }

  public downloadFolder() {
    if (this.activeFolder) {
      this.fileService.downloadFolder(this.activeFolder);
    }
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
     * Returns true if path is valid.
     *
     * @returns True if path is valid
     */
  nameValidation(name: string) {
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

  /**
   * Uploads one or more files to the currently active folder.
   *
   * @param files List of files to upload
   */
   uploadFiles(files: FileList) {
    for (let idx = 0; idx < files.length; idx++) {
      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe({
        next: () => {
          this.generalService.showFeedback('File was successfully uploaded', 'successMessage');
          this.fileInput = null;
          if (idx === (files.length - 1)){
            this.updateFileObject(this.activeFolder);
          }
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')});
    };
  }

  /*
   * Returns all folders in system to caller.
   */
  private getFolders(current: any = root) {
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
  private getFiles(current: any = root) {
    let result: string[] = [];
    for (const idx of current.children.filter(x => !x.isFolder)) {
      result.push(idx.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      result = result.concat(this.getFiles(idx));
    }
    return result;
  }

  /**
     * Updates the specified folder or file object only and re-renders TreeView.
     *
     * @param fileObject File object to update
     */
  public updateFileObject(fileObject: string) {
    let folder = fileObject;
    let isFile = false;
    if (!fileObject.endsWith('/')) {
      folder = folder.substring(0, folder.lastIndexOf('/') + 1);
      isFile = true;
    }

    let parent = root;
    const entities = folder.split('/').filter(x => x !== '');
    for (const idxPeek of entities.slice(0, entities.length)) {
      parent = parent.children.filter(x => x.name === idxPeek)[0];
    }
    parent.children = [];

    this.getFilesFromServer(folder).then((res: any) => {
      if (isFile) {
        this.fileService.loadFile(fileObject).subscribe({
          next: async (content: string) => {

            if (await this.getCodeMirrorOptions(fileObject) !== null) {
              this.openFiles.push({
                name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                path: fileObject,
                folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
                content: content,
                options: await this.getCodeMirrorOptions(fileObject),
              });
              this.currentFileData = this.openFiles.filter(x => x.path === fileObject)[0];
              this.showEditor.emit({ currentFileData: this.currentFileData });
              this.setFocusToActiveEditor.emit();
            }
            this.cdr.detectChanges();

            // If the code mirror can't open the file.
            // Lets the user decide what to do with it.
            if (await this.getCodeMirrorOptions(fileObject) === null) {
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
                  options: await this.getCodeMirrorOptions(fileObject)
                }
                if (data && data.download) {
                  this.downloadActiveFile(fileObject);
                } else if (data && data.deleteFile) {
                  this.deleteActiveFile(objectToDelete, true)
                }
              });
              return;
            }
          },
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
        })
      } else {
        this.dataBindTree();
        this.refetchEndpointsList();
        this.cdr.detectChanges();
      }
    })
  }

  private sort(event: any) {
    const node = this.findTreeNodeFolder(root, event.dialogResult.path);
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
      this.cdr.detectChanges();
      this.getEndpoints();
      this.updateFileObject(event.objectPath);
    }
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

  /**
   * Returns true if specified node has children.
   */
  public isExpandable(_: number, node: FlatNode) {
    return node.expandable;
  }

  /**
   * Searches in the files' name to apply filtering in the view.
   * @param node
   * @param searchKeyword coming from the searchbox.
   * @returns true if search keyword exists inside the node item's name
   */
  filterLeafNode(node: FlatNode, searchKeyword: string): boolean {
    if (!searchKeyword) {
      return false
    }
    return node.name.toLowerCase()
      .indexOf(searchKeyword?.toLowerCase()) === -1
  }

  /**
   * Searches in the folders' name to apply filtering in the view.
   * @param node
   * @param searchKeyword coming from the searchbox.
   * @returns true if search keyword exists inside the node item's name
   */
  filterParentNode(node: FlatNode, searchKeyword: string): boolean {
    if (
      !searchKeyword ||
      node.name.toLowerCase()
        .indexOf(
          searchKeyword?.toLowerCase()
        ) !== -1
    ) {
      return false
    }
    const descendants = this.treeControl.getDescendants(node)

    if (
      descendants.some(
        (descendantNode) =>
          descendantNode.name
            .toLowerCase()
            .indexOf(searchKeyword?.toLowerCase()) !== -1
      )
    ) {
      return false
    }
    return true
  }

  ngOnDestroy(): void {
    if (this.endpointSubscription) {
      this.endpointSubscription.unsubscribe();
      root.children = [];
    }
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

/**
* Root tree node pointing to root folder.
*/
const root: TreeNode = {
  name: '',
  path: '/',
  isFolder: true,
  children: [],
  level: 0,
};
