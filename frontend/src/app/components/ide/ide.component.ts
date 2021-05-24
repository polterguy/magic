
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

// Application specific imports.
import { FileService } from '../files/services/file.service';

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

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
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
      expandable: !!node.children && node.children.length > 0,
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
   * Shows file exporer if true.
   */
  public showExplorer = true;

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to load and save files.
   */
  public constructor(private fileService: FileService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving files and folder from server.
    this.getFilesFromServer();
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
    console.log(file.path);
  }

  /**
   * Invoked when file explorer's visibility should be toggled.
   */
  public toggleFileExplorer() {
    this.showExplorer = !this.showExplorer;
  }
}
