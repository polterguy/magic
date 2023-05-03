
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
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
