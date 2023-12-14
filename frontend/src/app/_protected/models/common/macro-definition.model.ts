
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { MacroArgument } from "./macro-argument.model";

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
