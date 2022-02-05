
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
