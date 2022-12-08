
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
