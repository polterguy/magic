
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * Model class for files currently being edited.
 */
export class FileNode {

  /**
   * Name of file.
   */
  name: string;

  /**
   * Full path and name of file.
   */
  path: string;

  /**
   * Folder where file exists.
   */
  folder: string;

  /**
   * Content of file.
   */
  content: string;

  /**
   * CodeMirror options for file type.
   */
  options: any;
}
