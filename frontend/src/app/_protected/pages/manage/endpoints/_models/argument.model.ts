
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Lookup } from "./lookup.model";

/**
 * Argument model describing a single argument to an endpoint.
 */
export class Argument {

  /**
   * The name of the argument.
   */
  name: string;

  /**
   * The Hyperlambda type of the argument.
   */
  type: string;

  /**
   * If table is a foreign key into another table, this will contain that data.
   */
  lookup: Lookup;

  /**
   * Special handling of fiel.
   */
  handling?: string;
}
