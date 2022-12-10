
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { ConfigService } from 'src/app/_protected/services/common/config.service';
import { CatalogNameComponent } from '../components/catalog-name/catalog-name.component';
import { ViewDbListComponent } from '../components/view-db-list/view-db-list.component';
import { SqlService } from '../_services/sql.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit {

  @Input() databaseTypes: string[] = [];

  /**
   * Options user has for selecting database types.
   */
  // public databaseTypes: any = [];

  /**
   * Options user has for selecting database types.
   */
  public dbTypes: any = [];

  /**
   * What database type user has selected.
   */
  public databaseType: string = '';

  /**
   * What connection string user has selected.
   */
  public connectionString: string = '';

  /**
   * Stores the given name for a new database to be connected.
   */
  public cStringName: string = '';

  /**
   * List of connected databases.
   */
  public databases: any = [];

  private configFile: any = {};

  public waitingTest: boolean = false;

  displayedColumns: string[] = ['dbType', 'cStringName', 'cString', 'status', 'actions'];

  public isLoading: boolean = true;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private sqlService: SqlService,
    private clipboard: Clipboard,
    private configService: ConfigService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {
    this.getDatabaseTypes();
  }

  copyConnectionString(element: any) {
    this.clipboard.copy(element.cString);
    this.generalService.showFeedback('Connection string can be found on your clipboard');
  }

  private getDatabaseTypes() {
    (async () => {
      while (!(this.databaseTypes && this.databaseTypes.length))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.databaseTypes && this.databaseTypes.length > 0) {
        this.databaseTypes.map((item: string) => {
          if (item !== 'sqlite') {
            this.dbTypes.push({ name: this.getDatabaseTypeName(item), type: item })
          }
        })
        this.databaseType = this.dbTypes[0].type;
        this.loadConfig();
      }
    })();
  }

  /**
   * Returns humanly readable type of database to caller.
   *
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
   * Invokes the endpoint to make sure the connection is valid
   * @param toTestBeforeSubmit Will be true if submit is requested and the connections string will be submitted only if the string is valid.
   */
  public testConnectionString(toTestBeforeSubmit?: boolean) {
    if (!(this.cStringName === '' || this.connectionString === '')) {
      if (this.validateConnectionString() === true) {
        if (this.checkName() === true) {
          this.waitingTest = true;
          const data: any = {
            databaseType: this.databaseType,
            connectionString: this.connectionString,
          };
          this.configService.connectionStringValidity(data).subscribe({
            next: (res: any) => {
              if (res.result === 'success') {
                if (toTestBeforeSubmit !== true) {
                  this.waitingTest = false;
                  this.generalService.showFeedback('Connection successful', 'successMessage');
                  return;
                } else {
                  this.connect();
                }
              } else if (res.result === 'failure') {
                this.waitingTest = false;
                this.generalService.showFeedback(res.message, 'errorMessage', 'Ok', 5000);
              }
            },
            error: (error: any) => {
              this.waitingTest = false;
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            },
          });
        } else {
          this.generalService.showFeedback('This name already exists in your database.', 'errorMessage', 'Ok', 3000);
        }
      } else {
        this.generalService.showFeedback('Connection string is not valid.', 'errorMessage', 'Ok', 3000);
      }
    } else {
      this.generalService.showFeedback('Please provide all fields', 'errorMessage');
    }
  }

  /**
   * Saves the new connection string.
   */
  private connect() {
    const data: any = {
      databaseType: this.databaseType,
      name: this.cStringName,
      connectionString: this.connectionString
    }
    this.sqlService.addConnectionString(data).subscribe({
      next: () => {
        this.generalService.showFeedback('Successfully connected.', 'successMessage');
        this.waitingTest = false;
        this.databases = [...this.databases, {
          dbType: this.dbTypes.find((db: any) => db.type === this.databaseType).name,
          dbTypeValue: this.databaseType,
          cString: this.connectionString,
          status: 'Live',
          cStringKey: this.cStringName,
          isClicked: false
        }]
        this.cdr.detectChanges();
        this.cStringName = '';
        this.connectionString = '';
        setTimeout(() => {
          this.backendService.getRecaptchaKey();
        }, 1000);
      },
      error: (error: any) => {
        this.waitingTest = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      }
    });
  }

  public deleteDb(item: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete connection string',
        description_extra: `You are deleting the following connection string: <br/> <span class="fw-bold">${item.cStringKey}</span> from ${item.dbType}.<br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `Connection string's name`,
          fieldToBeTypedValue: item.cStringKey,
          icon: 'conversion_path',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        item.isClicked = true;
        this.sqlService.deleteConnectionString(item.dbTypeValue, item.cStringKey).subscribe({
          next: () => {
            item.isClicked = false;
            this.generalService.showFeedback('Successfully deleted.', 'successMessage');
            this.databases = this.databases.filter((el: any) => item !== el);
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            item.isClicked = false;
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          }
        });
      }
    })
  }

  /**
   * Validates the provided connection string, to make sure it contains {database}.
   */
  private validateConnectionString() {
    return this.connectionString.includes('{database}')
  }

  /**
   * Making sure the given name doesn't already exist in the selected database.
   */
  private checkName() {
    return !this.configFile.databases[this.databaseType]?.[this.cStringName] ?? false;
  }

  /**
   * Loads configuration from backend.
   */
  private loadConfig() {
    this.configService.loadConfig().subscribe({
      next: (res: any) => {
        this.configFile = res.magic;

        let databases: any = [];
        this.dbTypes.forEach((type: any) => {
          for (const key in this.configFile.databases[type.type]) {
            databases.push({
              dbType: type.name,
              dbTypeValue: type.type,
              cString: this.configFile.databases[type.type][key],
              status: 'testing ...',
              cStringKey: key,
              isClicked: false
            });
            this.databases = [...databases];
          }
        });
        this.isLoading = false;
        this.getStatus();
      },
      error: (error: any) => this.generalService.showFeedback('Something went wrong, please refresh the page.', 'errorMessage')
    });
  }

  private getStatus() {
    this.databases.forEach((element: any) => {
      const data: any = {
        databaseType: element.dbTypeValue,
        connectionString: element.cString,
      };
      this.configService.connectionStringValidity(data).subscribe({
        next: (res: any) => {
          if (res?.result === 'failure') {
            element.status = 'Down';
          } else {
            element.status = 'Live';
          }
        },
        error: (res: any) => {
          element.status = 'Down';
        }
      })
    });
  }

  public getDatabasesList(item: any) {
    item.isClicked = true;
    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(item.dbTypeValue, item.cStringKey, true).subscribe({
      next: (res: any) => {
        if (res) {
          this.dialog.open(ViewDbListComponent, {
            width: '800px',
            data: {
              list: res.databases,
              item: item
            }
          })
        } else {
          this.generalService.showFeedback('No database was found.', null, 'Ok', 4000);
        }
        item.isClicked = false;
        this.generalService.hideLoading();
      },
      error: (error: any) => {
        this.generalService.showFeedback('Something went wrong, please try again later.', 'errorMessage');
        item.isClicked = false;
        this.generalService.hideLoading();
      }
    })
  }

  public createCatalog(item: any) {
    this.dialog.open(CatalogNameComponent, {
      width: '500px',
      data: item
    });
  }
}
