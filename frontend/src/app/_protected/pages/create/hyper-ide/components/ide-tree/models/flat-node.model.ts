
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { TreeNode } from "./tree-node.model";

/**
 *  Flat node with expandable and level information
 */
export interface FlatNode {

  /**
   * If true item is expandable.
   */
  expandable: boolean;

  /**
   * Display name of item.
   */
  name: string;

  /**
   * Number of indentations from root.
   */
  level: number;

  /**
   * Tree node wrapped by this instance.
   */
  node: TreeNode;
}
