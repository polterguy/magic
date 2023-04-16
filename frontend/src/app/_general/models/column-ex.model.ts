
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { ForeignKey } from "src/app/models/foreign-key.model";

/**
 * Column class containing meta information about
 * a single column in a single table.
 */
export class ColumnEx {

  /**
   * Name of column.
   */
  name: string;

  /**
   * Database type for column.
   */
  db: string;

  /**
   * Hyperlambda type for column.
   */
  hl: string;

  /**
   * Whether or not the column can accept null values.
   */
  nullable: boolean;

  /**
   * Whether or not column is a part of the primary key or not.
   */
  primary: boolean;

  /**
   * Whether or not the column has a default value.
   */
  automatic: boolean;

  /**
   * Whether or not column is expanded or not (viewing details).
   */
  expanded: boolean;

  /**
   * Optional additional information supplied to user.
   */
  warning?: string;

  /**
   * Whether or not column should be included in HTTP POST invocations or not.
   */
  post: boolean;

  /**
   * Whether or not column should be included in HTTP GET invocations or not.
   */
  get: boolean;

  /**
   * Whether or not column should be included in HTTP PUT invocations or not.
   */
  put: boolean;

  /**
   * Whether or not column should be included in HTTP DELETE invocations or not.
   */
  delete: boolean;

  /**
   * Whether or not user can change if column should be submitted to post invocations.
   */
  postDisabled: boolean;

  /**
   * Whether or not user can change if column should be submitted to get invocations.
   */
  getDisabled: boolean;

  /**
   * Whether or not user can change if column should be submitted to put invocations.
   */
  putDisabled: boolean;

  /**
   * Whether or not user can change if column should be submitted to delete invocations.
   */
  deleteDisabled: boolean;

  /**
   * Foreign key reference to use when crudifying table.
   */
  foreign_key?: ForeignKey;

  /**
   * Name of lock type for field.
   */
  locked?: string;

  /**
   * If column needs to be specially handled.
   */
  handling?: string;
}
