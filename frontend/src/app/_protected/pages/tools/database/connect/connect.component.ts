import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { ConfigService } from 'src/app/_protected/services/common/config.service';
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
  private _databases: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public databases = this._databases.asObservable();

  private configFile: any = {};

  public waitingTest: boolean = false;

  displayedColumns: string[] = ['dbName', 'dbType', 'cString', 'actions'];

  public isLoading: boolean = true;

  constructor(
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
          this.generalService.showFeedback(error, 'errorMessage')
        }
      });
    }
    catch (error) {
      this.waitingTest = false;
      this.generalService.showFeedback(error, 'errorMessage');
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
        this.getDatabasesDetails();
      },
      error: (error: any) => this.generalService.showFeedback('Something went wrong, please refresh the page.', 'errorMessage')});
  }

  private getDatabasesDetails() {
    let databases: any = [];
    this.databaseTypes.forEach((type: string) => {
      for (const key in this.configFile.databases[type]) {
        this.sqlService.getDatabaseMetaInfo(type, key).subscribe({
          next: (res: any) => {
            for (const el of res.databases) {
              databases.push({
                dbName: el.name,
                dbType: type,
                cString: this.configFile.databases[type][key],
                status: '',
                cStringKey: key
              });
              this._databases.next(databases.sort((a: any ,b: any) => a.dbName.localeCompare(b.dbName)));
            }
            this.isLoading = false;
          },
          error: (error: any) => {this._databases.next(databases); }
        })
      }
    });
    this.cdr.detectChanges();
  }

  public viewItem(item: any) {
    // TODO: navigate to generated databases
    // to see all the tables.
  }
}
