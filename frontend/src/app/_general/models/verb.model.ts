
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * HTTP verb model
 */
export class Verb {

  /**
   * Name of verb.
   */
  name: string;

  /**
   * Whether or not verb has been selected for
   * crudification or not.
   */
  generate: boolean;
}
