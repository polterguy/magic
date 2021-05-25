
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FileService } from '../files/services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EvaluatorService } from '../evaluator/services/evaluator.service';
import { FileObject, NewFileFolderDialogComponent } from './new-file-folder-dialog/new-file-folder-dialog.component';

// File types extensions.
import fileTypes from './../files/file-editor/file-types.json';

/*
 * Model for tree control.
 */
class TreeNode {

  /*
   * File name only.
   */
  name: string;

  /*
   * Full path of file, including folder(s).
   */
  path: string;

  /*
   * if true, this is a folder.
   */
  isFolder: boolean;

  /*
   * If true, this is expanded.
   */
  isExpanded: boolean;

  /**
   * Level from base.
   */
  level: number;

  /*
   * Children nodes.
   */
  children: TreeNode[];
}

/*
 *  Flat node with expandable and level information
 */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

/*
 * Model class for files currently being edited.
 */
class FileNode {

  /*
   * Name of file.
   */
  name: string;

  /*
   * Full path and name of file.
   */
  path: string;

  /*
   * Content of file.
   */
  content: string;

  /*
   * CodeMirror options for file type.
   */
  options: any;
}

/**
 * IDE component for creating Hyperlambda apps.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit {

  /**
   * If true, vocabulary has been loaded from server.
   */
   public vocabularyLoaded = false;

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  /*
   * Root tree node pointing to root folder.
   */
  private root: TreeNode = {
    name: '/',
    path: '/',
    isExpanded: false,
    isFolder: true,
    children: [],
    level: 0,
  };

  /*
   * Transforms from internal data structure to tree control's expectations.
   */
  private _transformer = (node: TreeNode, level: number) => {
    return {
      expandable: node.isFolder,
      name: node.name,
      level: level,
      node: node,
    };
  };

  /*
   * Flattens tree structure.
   */
  private treeFlattener = new MatTreeFlattener(
    this._transformer, node => node.level, node => node.expandable, node => node.children);

  /**
   * Actual tree control for component.
   */
  public treeControl = new FlatTreeControl<FlatNode>(
      node => node.level, node => node.expandable);

  /**
   * Actual data source for tree control.
   */
  public dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  /**
   * Currently edited files.
   */
  public files: FileNode[] = [];

  /**
   * Currently open file.
   */
  public activeFile: string = '';

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to load and save files.
   */
  public constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private feedbackService: FeedbackService,
    private evaluatorService: EvaluatorService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving files and folder from server.
    this.getFilesFromServer();
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
   * Invoked when user wants to create a new file or folder.
   */
  public createNewFileObject() {

    // Retrieving all possible folders in system to allow user to select folder to create object within.
    const folders = this.getFolders();

    // Creating modal dialog responsible for asking user for name and type of object.
    const dialogRef = this.dialog.open(NewFileFolderDialogComponent, {
      width: '550px',
      data: {
        isFolder: true,
        name: '',
        path: '/',
        folders: folders,
      },
    });

    // Subscribing to closed event and creating a new folder if we're given a folder name.
    dialogRef.afterClosed().subscribe((result: FileObject) => {

      // Verifying user clicked rename button
      if (result) {

        // Invoking backend to rename file or folder.
        const path = result.path + result.name;
        if (result.isFolder) {

          // We're supposed to create a folder.
          this.fileService.createFolder(path).subscribe((response: Response) => {

            // Showing user some feedback.
            this.feedbackService.showInfoShort('Folder successfully created');

          });

        } else {

          // We're supposed to create a file.
        }
      }
    });
  }

  /**
   * Invoked when files needs to be fetched from the server.
   */
  public getFilesFromServer() {

    // Retrieving files from backend.
    this.fileService.listFoldersRecursively('/').subscribe((folders: string[]) => {

      // Creating our initial tree structure.
      for (const idx of folders) {
        const entities = idx.split('/').filter(x => x !== '');
        let parent = this.root;
        let level = 1;
        for (const idxPeek of entities.slice(0, entities.length - 1)) {
          parent = parent.children.filter(x => x.name === idxPeek)[0];
          level += 1;
        }
        parent.children.push({
          name: entities[entities.length - 1],
          path: idx,
          isFolder: true,
          isExpanded: false,
          level: level,
          children: [],
        });
      }

      // Retrieving all files from backend.
      this.fileService.listFilesRecursively('/').subscribe((files: string[]) => {
        
        // Adding files to initial structure.
        for (const idx of files) {
          const entities = idx.split('/').filter(x => x !== '');
          let parent = this.root;
          let level = 1;
          for (const idxPeek of entities.slice(0, entities.length - 1)) {
            parent = parent.children.filter(x => x.name === idxPeek)[0];
            level += 1;
          }
          parent.children.push({
            name: entities[entities.length - 1],
            path: idx,
            isFolder: false,
            isExpanded: false,
            level: level,
            children: [],
          });
        }
        this.dataSource.data = this.root.children;
      });
    });
  }

  /**
   * Returns true if specified node has children.
   */
  public hasChild(_: number, node: FlatNode) {
    return node.expandable;
  }

  /**
   * Invoked when user wants to open a file.
   * 
   * @param file Tree node wrapping file to open
   */
  public openFile(file: TreeNode) {

    // Checking if file is already opened.
    if (this.files.filter(x => x.path === file.path).length > 0) {

      // Yup, file already opened.
      this.activeFile = file.path;

    } else {

      // Verifying we have an existing editor for file type.
      const extension = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
      const options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
      if (options.length === 0) {

        // Oops, no known editor for file.
        this.feedbackService.showInfoShort('No known editor for file type');
        return;
      }

      // AutoFocus makes page "jump", hence turning it off.
      options[0].options.autofocus = false;

      // Turning on maximize keyboard shortcut.
      if (options[0].options.extraKeys) {
        options[0].options.extraKeys['Alt-M'] = (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        };
      }

      // Retrieving file's content from backend.
      this.fileService.loadFile(file.path).subscribe((content: string) => {

        // Pushing specified file into files currently being edited object.
        this.files.push({
          name: file.name,
          path: file.path,
          content: content,
          options: options[0].options,
        });
        this.activeFile = file.path;
      });
    }
  }

  /**
   * Invoked when a file should be saved.
   * 
   * @param file File to save
   */
   public saveFile(file: FileNode) {

    // Removing file from edited files.
    this.fileService.saveFile(file.path, file.content).subscribe(() => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort('File successfully saved');

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when a file should be closed.
   * 
   * @param file File to close
   */
  public closeFile(file: FileNode) {

    // Removing file from edited files.
    let idx = this.files.indexOf(file);
    this.files.splice(idx, 1);
    if (this.files.length === 0) {
      this.activeFile = null;
    } else {
      if (idx >= this.files.length) {
        idx = 0;
      }
      this.activeFile = this.files[idx].path;
    }
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns all folders in system to caller.
   */
  private getFolders(current: TreeNode = this.root) {

    // Finding all folders in currently iterated level.
    const result: string[] = [];
    result.push(current.path);
    for (const idx of current.children.filter(x => x.isFolder)) {
      const inner = this.getFolders(idx);
      for (const idxInner of inner) {
        result.push(idxInner);
      }
    }
    return result;
  }
}
