
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
