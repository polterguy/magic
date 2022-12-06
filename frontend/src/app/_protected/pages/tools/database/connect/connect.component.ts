import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
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

  private loopIndex: number = 1;

  private configFile: any = {};

  public waitingTest: boolean = false;

  displayedColumns: string[] = ['dbType', 'cString', 'status', 'actions'];

  public isLoading: boolean = true;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private sqlService: SqlService,
    private configService: ConfigService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getDatabaseTypes();

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
                  this.generalService.showFeedback('Connection successful.', 'successMessage');
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
              this.generalService.showFeedback(error?.error?.message??error, 'errorMessage');
            },
          });
        } else {
          this.generalService.showFeedback('This name already exists in your database.', 'errorMessage', 'Ok', 3000);
        }
      } else {
        this.generalService.showFeedback('Connection string is not valid.', 'errorMessage', 'Ok', 3000);
      }
    } else {
      this.generalService.showFeedback('Please fill all the fields.', 'errorMessage');
    }
  }

  /**
   * Saves the new connection string.
   */
  private connect() {
    let selectedDb = JSON.parse(this.configFile);
    selectedDb.magic.databases[this.databaseType][this.cStringName] = this.connectionString;
    this.configFile = JSON.stringify(selectedDb, null, 2);

    try {
      const config = JSON.parse(this.configFile);
      this.configService.saveConfig(config).subscribe({
        next: () => {
          this.generalService.showFeedback('Successfully connected.', 'successMessage');
          this.waitingTest = false;
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
    catch (error) {
      this.waitingTest = false;
      this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
    }
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
    return !this.configFile.databases[this.databaseType][this.cStringName];
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
            this.getStatus(type.type, this.configFile.databases[type.type][key]).then((res: string) => {
              databases.push({
                dbType: type.name,
                dbTypeValue: type.type,
                cString: this.configFile.databases[type.type][key],
                status: res,
                cStringKey: key,
                isClicked: false
              });
              this.databases = [...databases];
            })
          }
        });

      },
      error: (error: any) => this.generalService.showFeedback('Something went wrong, please refresh the page.', 'errorMessage')
    });
  }

  private getStatus(databaseType: string, connectionString: string) {
    return new Promise(resolve => {
      const data: any = {
        databaseType: databaseType,
        connectionString: connectionString,
      };
      this.configService.connectionStringValidity(data).subscribe({
        next: (res: any) => {
          resolve('Live')
        },
        error: (res: any) => {
          resolve('Down')
        },
        complete:()=>{
          let count = this.loopIndex++;
          if(count === this.dbTypes.length) {
            this.isLoading = false;
          }
        }
      })
    })
  }

  public getDatabasesList(item: any) {
    item.isClicked = true;
    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(item.dbTypeValue, item.cStringKey).subscribe({
      next: (res: any) => {
        if (res) {
          this.dialog.open(ViewDbListComponent, {
            width: '800px',
            autoFocus: false,
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
