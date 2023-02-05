
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Crudify } from '../models/crudify.model';
import { TableEx } from '../models/table-ex.model';

/**
 * Transformation service building a Crudify object given the specific arguments.
 */
@Injectable({
  providedIn: 'root'
})
export class TransformModelService {

  /**
   * Whether or not existing endpoints should be overwritten or not.
   */
  overwrite = false;

  /**
   * Whether or not scaffolding should create verbose endpoints, implying applying
   * as many argument options as possible, or only apply the bare minimum.
   */
  verbose = false;

  /**
   * Whether or not scaffolding should create left joins for backend GET endpoints.
   */
  join = true;

  /**
   * Transforms the specified input to a Crudify instance, required to invoke backend
   *
   * @param databaseType Type of database, 'mysql' or 'mssql' for instance
   * @param database Connection string and database name, e.g. [generic|babelfish]
   * @param table Name of table to crudify
   * @param verb HTTP verb, 'post', 'put', 'get' or 'delete'
   */
  transform(
    databaseType: string,
    database: string,
    table: TableEx,
    verb: string) {

    const result = new Crudify();
    result.databaseType = databaseType;
    result.database = database;
    result.moduleName = table.moduleName;
    result.moduleUrl = table.moduleUrl;
    result.table = table.name;
    result.verb = verb;
    result.returnId = (table.columns || []).filter(x => x.primary && !x.automatic).length === 0;
    result.overwrite = this.overwrite;
    result.verbose = this.verbose;
    result.join = this.join;
    result.validators = table.validators;
    result.cqrs = table.cqrs;
    result.cqrsAuthorisation = table.cqrsAuthorisation;
    result.generate_training_data = table.generate_training_data;
    if (table.cqrsAuthorisation === 'roles' || table.cqrsAuthorisation === 'groups' || table.cqrsAuthorisation === 'users') {
      result.cqrsAuthorisationValues = table.cqrsAuthorisationValues;
    }

    if (table.cache && table.cache > 0) {
      result.cache = table.cache;
      result.publicCache = table.publicCache;
    }

    if (verb === 'delete' && table.logDelete) {
      result.log = `${table.moduleName}.${table.name} entry deleted`;
    }

    if (verb === 'put' && table.logPut) {
      result.log = `${table.moduleName}.${table.name} entry updated`;
    }

    if (verb === 'post' && table.logPost) {
      result.log = `${table.moduleName}.${table.name} entry created`;
    }

    if (verb === 'post' && table.authPost) {
      result.auth = table.authPost;
    }
    if (verb === 'get' && table.authGet) {
      result.auth = table.authGet;
      result.paging = table.paging;
      result.sorting = table.sorting;
    }
    if (verb === 'put' && table.authPut) {
      result.auth = table.authPut;
    }
    if (verb === 'delete' && table.authDelete) {
      result.auth = table.authDelete;
    }

    if (verb === 'post' && table.captchaPost && table.captchaPost !== 0) {
      result.captcha = table.captchaPost;
    }
    if (verb === 'get' && table.captchaGet && table.captchaGet !== 0) {
      result.captcha = table.captchaGet;
    }
    if (verb === 'put' && table.captchaPut && table.captchaPut !== 0) {
      result.captcha = table.captchaPut;
    }
    if (verb === 'delete' && table.captchaDelete && table.captchaDelete !== 0) {
      result.captcha = table.captchaDelete;
    }

    switch (verb) {

      case 'post':
        result.template = '/system/crudifier/templates/crud.template.post.hl';
        break;

      case 'get':
        if (this.verbose) {
          result.template = '/system/crudifier/templates/crud.template.get.hl';
        } else {
          result.template = '/system/crudifier/templates/crud.template-no-operator.get.hl';
        }
        break;

      case 'put':
        result.template = '/system/crudifier/templates/crud.template.put.hl';
        break;

      case 'delete':
        result.template = '/system/crudifier/templates/crud.template.delete.hl';
        break;

      default:
        throw new Error('Oops, unknown verb');
    }

    result.args = {
      columns: [],
      primary: [],
    };
    for (const idxColumn of (table.columns || [])) {

      switch (verb) {

        case 'post':
          if (idxColumn.post) {
            const cur = {
              name: idxColumn.name,
              type: idxColumn.hl,
            };
            if (idxColumn.locked) {
              cur['locked'] = idxColumn.locked;
            }
            if (idxColumn.handling) {
              cur['handling'] = idxColumn.handling;
            }
            if (idxColumn.foreign_key && idxColumn.foreign_key.foreign_name !== null) {
              cur['foreign_key'] = {
                table: idxColumn.foreign_key.foreign_table,
                column: idxColumn.foreign_key.foreign_column,
                name: idxColumn.foreign_key.foreign_name,
                long: idxColumn.foreign_key.long_data,
              };
            }
            result.args.columns.push(cur);
          }
          break;

        case 'get':
          if (idxColumn.get) {
            const cur = {
              name: idxColumn.name,
              type: idxColumn.hl,
            };
            if (idxColumn.locked) {
              cur['locked'] = idxColumn.locked;
            }
            if (idxColumn.handling) {
              cur['handling'] = idxColumn.handling;
            }
            if (idxColumn.foreign_key && idxColumn.foreign_key.foreign_name !== null) {
              cur['foreign_key'] = {
                table: idxColumn.foreign_key.foreign_table,
                column: idxColumn.foreign_key.foreign_column,
                name: idxColumn.foreign_key.foreign_name,
                long: idxColumn.foreign_key.long_data,
              };
            }
            result.args.columns.push(cur);
          }
          break;

        case 'put':
          if (idxColumn.put) {
            const cur = {
              name: idxColumn.name,
              type: idxColumn.hl,
            };
            if (idxColumn.locked) {
              cur['locked'] = idxColumn.locked;
            }
            if (idxColumn.handling) {
              cur['handling'] = idxColumn.handling;
            }
            if (idxColumn.foreign_key && idxColumn.foreign_key.foreign_name !== null) {
              cur['foreign_key'] = {
                table: idxColumn.foreign_key.foreign_table,
                column: idxColumn.foreign_key.foreign_column,
                name: idxColumn.foreign_key.foreign_name,
                long: idxColumn.foreign_key.long_data,
              };
            }
            if (idxColumn.primary) {
              result.args.primary.push(cur);
            } else {
              result.args.columns.push(cur);
            }
          }
          break;

        case 'delete':
          if (idxColumn.delete) {
            if (idxColumn.primary) {
              result.args.primary.push({
                [idxColumn.name]: idxColumn.hl
              });
            }
          } else {
            if (idxColumn.locked) {
              result.args.columns.push({
                name: idxColumn.name,
                locked: idxColumn.locked,
              });
            }
          }
          break;
      }
    }
    return result;
  }
}
