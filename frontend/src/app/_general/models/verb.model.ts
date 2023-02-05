
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
