
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
