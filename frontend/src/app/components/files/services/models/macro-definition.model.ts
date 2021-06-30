
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * A single macro argument.
 */
export class MacroArgument {

  /**
   * Name of argument.
   */
  name: string;

  /**
   * Type of srgument, e.g. 'sql', 'string', 'int' etc.
   */
  type: string;

  /**
   * Description for argument.
   */
  description: string;

  /**
   * If true argument is mandatory.
   */
  mandatory: boolean;

  /**
   * Value of argument.
   */
  value?: any;
}

/**
 * Model describing a single macro.
 */
export class MacroDefinition {

  /**
   * Descriptive name of macro.
   */
  name: string;

  /**
   * Description of macro.
   */
  description: string;

  /**
   * Arguments that can be pass into macro.
   */
  arguments: MacroArgument[];
}
  