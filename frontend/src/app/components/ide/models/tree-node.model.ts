
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Model for tree control.
 */
export class TreeNode {

  /**
   * File name only.
   */
  public name: string;

  /**
   * Full path of file, including folder(s).
   */
  public path: string;

  /**
   * if true, this is a folder.
   */
  public isFolder: boolean;

  /**
   * Level from base.
   */
  public level: number;

  /**
   * Children nodes.
   */
  public children: TreeNode[];
}
