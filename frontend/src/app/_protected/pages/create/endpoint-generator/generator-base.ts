
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ActivatedRoute } from "@angular/router";
import { Databases } from "src/app/_general/models/databases.model";
import { DefaultDatabaseType } from "src/app/_general/models/default-database-type.model";
import { GeneralService } from "src/app/_general/services/general.service";
import { SqlService } from "src/app/_general/services/sql.service";
import { Role } from "../../manage/user-and-roles/_models/role.model";
import { RoleService } from "../../manage/user-and-roles/_services/role.service";

/**
 * Base class for generators, implementing common functionality.
 */
export abstract class GeneratorBase {

  roles: Role[] = [];

  isLoading: boolean = false;

  databaseTypes: any = [];
  connectionStrings: string[] = [];
  databases: any = [];

  selectedDbType: string = null;
  selectedConnectionString: string = null;
  selectedDatabase: string = null;

  constructor(
    protected generalService: GeneralService,
    protected roleService: RoleService,
    protected activatedRoute: ActivatedRoute,
    protected sqlService: SqlService) { }

  /**
   * Initialises component.
   */
  protected init() {

    // Checking if we've got query parameters.
    this.isLoading = true;
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param && param.dbName && param.dbType && param.dbCString) {
        this.selectedDbType = param.dbType;
        this.selectedConnectionString = param.dbCString;
        this.selectedDatabase = param.dbName;
      }

      // Retrieving database types, and default to use.
      this.sqlService.defaultDatabaseType().subscribe({
        next: (dbTypes: DefaultDatabaseType) => {
          this.databaseTypes = dbTypes.options.map(x => {
            return {
              name: this.getDatabaseName(x),
              type: x
            };
          });
          if (!this.selectedDbType) {
            this.selectedDbType = dbTypes.default;
            this.getConnectionString(false);
          } else {
            this.getConnectionString(true);
          }
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    });

    // Retreiving roles.
    this.roleService.list().subscribe({
      next: (res: Role[]) => {
        this.roles = res || [];
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000)
    });
  }

  /**
   * Retrieves the connection strings of the active database type.
   */
  public getConnectionString(init: boolean = false) {
    this.isLoading = true;
    this.sqlService.connectionStrings(this.selectedDbType).subscribe({
      next: (connectionStrings: any) => {
        this.connectionStrings = Object.keys(connectionStrings || {});
        if (!init) {
          this.selectedConnectionString = this.connectionStrings[0];
        }
        this.getDatabases(init);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
    });
  }

  /**
   * Retrieves a list of databases already available on the user's backend.
   */
  public getDatabases(init: boolean = false) {
    this.isLoading = true;
    this.sqlService.getDatabaseMetaInfo(
      this.selectedDbType,
      this.selectedConnectionString).subscribe({
        next: (res: Databases) => {
          this.databases = res.databases || [];
          if (this.databases.length > 0) {
            if (!init) {
              this.selectedDatabase = this.databases[0].name;
            }
            this.databaseLoaded();
          }
          this.isLoading = false;
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000)
      });
  }

  protected abstract databaseLoaded(): void;

  /*
   * Returns friendly name for database type.
   */
  private getDatabaseName(type: string) {
    switch (type) {
      case 'mssql': return 'SQL Server';
      case 'mysql': return 'MySQL';
      case 'pgsql': return 'PostgreSQL';
      case 'sqlite': return 'SQLite';
    }
  }
}