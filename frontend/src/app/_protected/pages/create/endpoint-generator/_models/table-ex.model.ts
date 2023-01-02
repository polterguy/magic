
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Application specific imports.
import { Verb } from "./verb.model";
import { ColumnEx } from "./column-ex.model";
import { ForeignKey } from "src/app/models/foreign-key.model";

/**
 * Table class containing meta information about
 * a single table in a single database.
 */
export class TableEx {

  /**
   * Name of table.
   */
  name: string;

  /**
   * Name of module to generate.
   */
  moduleName?: string;

  /**
   * Name of module to generate.
   */
  moduleUrl?: string;

  /**
   * Number of seconds to cache results of
   * read and count endpoint.
   */
  cache?: number;

  /**
   * Whether or not cache should be public or not, implying
   * proxies can cache result.
   */
  publicCache?: boolean;

  /**
   * Columns in table.
   */
  columns: ColumnEx[];

  /**
   * HTTP verbs to generate for table.
   */
  verbs: Verb[];

  /**
   * Whether or not post invocations should be logged.
   */
  logPost: boolean;

  /**
   * Whether or not delete invocations should be logged.
   */
  logDelete: boolean;

  /**
   * Whether or not put invocations should be logged.
   */
  logPut: boolean;

  /**
   * Authentication requirements for invoking POST endpoint.
   */
  authPost: string;

  /**
   * Authentication requirements for invoking GET endpoint.
   */
  authGet: string;

  /**
   * Authentication requirements for invoking PUT endpoint.
   */
  authPut: string;

  /**
   * Authentication requirements for invoking DELETE endpoint.
   */
  authDelete: string;

  /**
   * reCAPTCHA requirements for invoking POST endpoint.
   */
  captchaPost?: number;

  /**
   * reCAPTCHA requirements for invoking GET endpoint.
   */
  captchaGet?: number;

  /**
   * reCAPTCHA requirements for invoking PUT endpoint.
   */
  captchaPut?: number;

  /**
   * reCAPTCHA requirements for invoking DELETE endpoint.
   */
  captchaDelete?: number;

  /**
   * Additional validators, injectables and transformers for endpoint.
   */
  validators: string;

  /**
   * Whether or not to turn on the CQRS pattern for table or not.
   */
  cqrs: boolean;

  /**
   * If CQRS is turned on, this declares what type of authorisation requirements
   * the messages will be published with. Legal values are.
   * 
   * - none
   * - inherited
   * - roles
   * 
   * If type is 'roles' the cqrsAuthorisationValues should be a comma separated
   * list of which roles messages are published to.
   */
  cqrsAuthorisation?: string;

  /**
   * Only relevant if above field is 'roles', at which point this should be
   * the comma separated list of which roles messages are published to.
   */
  cqrsAuthorisationValues?: string;

  /**
   * Foreign keys in table.
   */
  foreign_keys: ForeignKey[];
}
