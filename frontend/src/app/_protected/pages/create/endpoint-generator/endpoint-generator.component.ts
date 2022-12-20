
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../manage/user-and-roles/_models/role.model';
import { RoleService } from '../../manage/user-and-roles/_services/role.service';
import { SqlService } from '../../../../_general/services/sql.service';
import { DefaultDatabaseType } from 'src/app/_general/models/default-database-type.model';
import { Databases } from 'src/app/_general/models/databases.model';

/**
 * Common endpoint generator component for both auto CRUD API generator and SQL generator.
 */
@Component({
  selector: 'app-endpoint-generator',
  templateUrl: './endpoint-generator.component.html',
  styleUrls: ['./endpoint-generator.component.scss']
})
export class EndpointGeneratorComponent implements OnInit {

  /**
   * List of all database types, including type and the human readable name of each.
   */
  public databaseTypes: any = [];

  /**
   * The user's default database type.
   */
  public defaultDbType: string = '';

  /**
   * List of connection strings available for the selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * The connection string of the user's default database type.
   */
  public defaultConnectionString: string = '';

  /**
   * Available databases based on the user's selected database type and the connection string.
   */
  public databases: any = [];

  /**
   * Available roles as published by the backend.
   */
  public roles: Role[] = [];

  /**
   * To watch for the changes in database changes.
   */
  private _dbLoading: ReplaySubject<boolean> = new ReplaySubject();
  public dbLoading = this._dbLoading.asObservable();

  private paramDbType: string = '';
  public paramDbName: string = '';
  private paramDbConnectionString: string = '';

  constructor(
    private sqlService: SqlService,
    private roleService: RoleService,
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService) {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param && param.dbName && param.dbType && param.dbCString) {
        this.paramDbName = param.dbName;
        this.paramDbType = param.dbType;
        this.paramDbConnectionString = param.dbCString;
      }
    })
  }

  ngOnInit() {
    this.getDefaultDbType();
    this.getRoles();
  }

  /**
   * Invokes endpoint to get the default database type.
   * Retrieves all available database types and specifies the default one.
   */
  private getDefaultDbType() {
    this._dbLoading.next(true);
    this.sqlService.defaultDatabaseType().subscribe({
      next: (dbTypes: DefaultDatabaseType) => {
        this.defaultDbType = this.paramDbType !== '' ? this.paramDbType : dbTypes.default;
        dbTypes.options.map((item: string) => {
          this.databaseTypes.push({ name: this.getDatabaseTypeName(item), type: item });
        });
        let dataToPass: any = {
          selectedDbType: this.defaultDbType
        };
        if (this.paramDbConnectionString !== '') {
          dataToPass.selectedConnectionString = this.paramDbConnectionString;
        }
        this.getConnectionString(dataToPass);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Returns humanly readable type of database to caller.
   * @param type Type delaration
   */
  private getDatabaseTypeName(type: string) {
    switch (type) {
      case 'mysql': return 'MySQL';
      case 'sqlite': return 'SQLite';
      case 'pgsql': return 'PostgreSQL';
      case 'mssql': return 'SQL Server';
    }
  }

  /**
   * Retrieves the connection string of the default database.
   * @param selectedDbType Default type of the databases, sets during the initial configuration.
   */
  public getConnectionString(event: { selectedDbType: string, selectedConnectionString?: string }) {
    this._dbLoading.next(true);
    this.defaultConnectionString = '';
    this.connectionStrings = [];
    this.defaultDbType = event.selectedDbType;
    this.sqlService.connectionStrings(event.selectedDbType).subscribe({
      next: (connectionStrings: any) => {
        this.connectionStrings = connectionStrings;
        if (connectionStrings) {
          this.defaultConnectionString = event.selectedConnectionString ? event.selectedConnectionString : (Object.keys(connectionStrings).indexOf('generic') > -1 ? 'generic' : Object.keys(connectionStrings)[0]);
          this.getDatabases(event.selectedDbType, event.selectedConnectionString ?? this.defaultConnectionString);
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Retrieves a list of databases already available on the user's backend.
   */
  private getDatabases(selectedDbType: string, selectedConnectionString: string) {
    this.databases = [];
    this.sqlService.getDatabaseMetaInfo(
      selectedDbType,
      selectedConnectionString).subscribe({
        next: (res: Databases) => {
          this.databases = res.databases || [];
          this._dbLoading.next(false);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000)
      });
  }

  /*
   * Returns all available roles from the backend
   */
  private getRoles() {
    this.roleService.list().subscribe({
      next: (res: Role[]) => {
        this.roles = res || [];
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000)
    })
  }
}
