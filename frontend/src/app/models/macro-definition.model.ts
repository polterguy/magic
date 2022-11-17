
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { MacroArgument } from "../_protected/models/common/macro-argument.model";

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
