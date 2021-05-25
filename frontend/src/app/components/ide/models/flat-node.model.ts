
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

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
}
