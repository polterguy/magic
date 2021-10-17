
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Model class for files currently being edited.
 */
export class FileNode {

  /**
   * Name of file.
   */
  public name: string;

  /**
   * Full path and name of file.
   */
  public path: string;

  /**
   * Folder where file exists.
   */
  public folder: string;

  /**
   * Content of file.
   */
  public content: string;

  /**
   * CodeMirror options for file type.
   */
  public options: any;
}
