import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { BazarService } from 'src/app/_protected/services/common/bazar.service';
import { CacheService } from 'src/app/_protected/services/common/cache.service';
import { ConfigService } from 'src/app/_protected/services/common/config.service';
import { environment } from 'src/environments/environment';
import { FileService } from '../../../hyper-ide/_services/file.service';
import { AppManifest } from '../../../plugins/_models/app-manifest';
import { BazarApp } from '../../../plugins/_models/bazar-app.model';
import { ViewDbComponent } from '../components/view-db/view-db.component';
import { Databases } from '../_models/databases.model';
import { DefaultDatabaseType } from '../_models/default-database-type.model';
import { SqlService } from '../_services/sql.service';

@Component({
  selector: 'app-add-new-database',
  templateUrl: './add-new-database.component.html',
  styleUrls: ['./add-new-database.component.scss']
})
export class AddNewDatabaseComponent implements OnInit, OnDestroy {

  public databaseName: string = '';

  displayedColumns: string[] = ['dbName', 'tables', 'actions'];

  public databases: any = [];

  public plugins: any = [];

  public existingDatabases: any = [];

  private appDetails: any = [];

  private databaseType: string = '';

  public databaseTypes: string[] = [];

  private connectionString: string = '';

  public waitingInstallation: boolean = false;

  public currentStage: string = 'Prepering database to be downloaded.';

  public isLoadingDbs: boolean = true;
  public isLoadingPlugins: boolean = true;

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app is ready to be installed.
   */
  private hubConnection: HubConnection = null;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private fileService: FileService,
    private cacheService: CacheService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private generalService: GeneralService,
    private backendService: BackendService) { }

  ngOnInit(): void {
    this.getItems();
    this.getDefaultDbType();
  }

  /*
   * Lists apps from Bazar server.
   */
  private getItems() {
    this.bazarService.listBazarItems('%%', 0, 1000).subscribe({
      next: (apps: BazarApp[]) => {
        this.databases = apps.filter((item: any) => { return item.name.indexOf('DB') > -1 }) || [];
        this.databases.map((item: any) => {
          this.plugins[item.name] = item;
          item.hasUpdate = false;
        });
        this.loadDetails();
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /*
   * Loads manifests of installed apps from current installation.
   */
  private loadDetails() {
    this.bazarService.localManifests().subscribe({
      next: (manifests: AppManifest[]) => {
        this.appDetails = manifests || [];
        if (manifests) {
          this.databases.map((item: any) => this.appDetails.map((el: any) => {
            if (item.name === el.name) {
              item.details = el;
            }
          }))
          manifests.forEach((item: any) => {
            this.getVersion(item.module_name, item.version);
          })
        }
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /**
   * Invokes endpoint to get the latest version.
   * @param module_name Module name of each installed app.
   * @param appVersion Version of each installed app.
   */
  private getVersion(module_name: string, appVersion: string) {
    this.bazarService.getBazarItem(module_name).subscribe({
      next: (res: any) => {
        if (res) {
          this.versionComparision(module_name, appVersion, res[0].version);
          this.backendService.showObscurer(false);
        }
      },
      error: (error: any) => { }
    })
  }

  /**
   * Doing a version compare of the installed app and the latest version of app as published by Bazar API.
   * TODO: This is kind of stupid to do over an HTTP invocation, since it's just a string comparison
   * of two version numbers such as for instance "v5.6.7".
   * @param module_name Module name of each installed app.
   * @param appVersion Version of each installed app.
   * @param lastestVersion Retrieved from getVersion function.
   */
  private versionComparision(module_name: string, appVersion: string, lastestVersion: string) {
    if (this.databases) {
      const item = this.databases.find((item: any) => item?.details?.module_name === module_name);
      this.configService.versionCompare(appVersion, lastestVersion).subscribe({
        next: (versionCompare: any) => {
          if (+versionCompare.result === -1) {
            if (item) {
              item.hasUpdate = true;
              item.newVersion = lastestVersion;
            }
          }

          this.isLoadingPlugins = false;
        },
        error: (error: any) => { }
      });

    }
  }

  public installDb(database: any) {
    this.generalService.showLoading();
    this.waitingInstallation = true;
    this.configService.rootUserEmailAddress().subscribe({
      next: (userDerails: any) => {
        this.bazarService.purchaseBazarItem(
          database,
          userDerails.name,
          userDerails.email,
          false,
          null).subscribe({
            next: (status: any) => {
              this.connectSocket(status.code, database);
            },
            error: (error: any) => {
              this.generalService.showFeedback(error, 'errorMessage');
              this.generalService.hideLoading();
              this.waitingInstallation = false;
            }
          });
      },
      error: (error: any) => {
        this.generalService.hideLoading();
        this.waitingInstallation = false;
      }
    })
  }

  /*
   * Creates a SignalR subscriber that waits for the Bazar to publish a message verifying
   * that the payment has been accepted.
   */
  private connectSocket(token: string, database: any) {
    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(environment.bazarUrl + '/sockets', {
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    /*
     * Subscribing to SignalR message from Bazar that is published
     * once app is ready to be downloaded.
     */
    this.hubConnection.on('bazar.package.avilable.' + token, (args: string) => {
      this.getDb(database, token);
    });

    this.hubConnection.start().then(() => {
      this.getDb(database, token);
    });
  }

  /*
   * Invoked when app should be installed.
   */
  private getDb(app: BazarApp, token: string) {
    this.currentStage = 'Downloading database';
    this.bazarService.downloadBazarItem(app, token).subscribe({
      next: (download: any) => {
        if (download.result === 'success') {
          this.currentStage = 'Installing database';
          this.bazarService.installBazarItem(app.folder_name, app.version, app.name, token).subscribe({
            next: (install: any) => {
              if (install.result === 'success') {
                this.generalService.showFeedback('Plugin was successfully installed on your server', 'successMessage');

                this.getDatabases();
                this.loadDetails();

                /*
                  * Making sure we turn OFF socket connections if these have been created.
                  * Notice, socket connections are NOT turned on for immediate downloads (free apps).
                  */
                if (this.hubConnection) {
                  this.hubConnection.stop();
                  this.hubConnection = null;
                }

            } else {
              this.generalService.showFeedback('Oops! Please check the system log.', 'errorMessage', 'Ok', 5000);
            }
          },
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
        });
        } else {
          this.generalService.showFeedback('Oops! Please check the system log.', 'errorMessage', 'Ok', 5000);
        }
      },
      error: (error: any) => {
        /*
        * Making sure we turn OFF socket connections if these have been created.
        * Notice, socket connections are NOT turned on for immediate downloads (free apps).
        */
        if (this.hubConnection) {
          this.hubConnection.stop();
          this.hubConnection = null;
        }
        this.generalService.hideLoading();
        this.waitingInstallation = false;
        this.generalService.showFeedback('Refresh the page and try again.', 'errorMessage')
      }
    });
  }

  /**
   * Uninstalls the selected database.
   * @param database Item to uninstall
   */
  public uninstallDb(database: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${database?.name}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.fileService.deleteFolder('/modules/' + database.module_name + '/').subscribe({
          next: (res: any) => {
            this.generalService.showFeedback(database.name + ' uninstalled successfully.', 'successMessage');
            this.clearServersideCache();
            this.getItems();
            this.getDatabases();
          },
          error: (error: any) => { this.generalService.showFeedback(error, 'errorMessage') }
        });
      }
    })
  }

  public deleteDb(dbName: string) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${dbName}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.sqlService.dropDatabase(
          this.databaseType,
          this.connectionString,
          dbName).subscribe({
            next: () => {
              this.generalService.showFeedback('Database successfully deleted.', 'successMessage');
              this.clearServersideCache();
              this.getDatabases();
              this.getItems();
            },
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
          });
      }
    })
  }

  /**
   * Invokes endpoint to get the default database type.
   * Retrieves all available database types and specifies the default one.
   */
  private getDefaultDbType() {
    this.sqlService.defaultDatabaseType().subscribe({
      next: (dbTypes: DefaultDatabaseType) => {
        this.databaseTypes = dbTypes.options;
        this.getConnectionString(dbTypes.default);
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }

  /**
   * Retrieves the connection string of the default database.
   * @param dbType Default type of the databases, sets during the initial configuration.
   */
  private getConnectionString(dbType: string) {
    this.sqlService.connectionStrings(dbType).subscribe({
      next: (connectionStrings: any) => {
        if (connectionStrings) {
          this.databaseType = dbType,
          this.connectionString = Object.keys(connectionStrings)[0];
          this.getDatabases();
        }
      },
      error: (error: any) => { }
    });
  }

  /**
   * Retrieves a list of databases already available on the user's backend.
   */
  private getDatabases() {
    this.isLoadingDbs = true;
    for (const type of this.databaseTypes) {
      this.sqlService.getDatabaseMetaInfo(
        type,
        this.connectionString).subscribe({
          next: (res: Databases) => {
            res.databases.map((item: any) => {
              item.type = type;
              item.connectionString = this.connectionString;
            });
            this.existingDatabases = [...this.existingDatabases, ...res.databases];

            // Makes difference only after a successful installation.
            if (type === this.databaseTypes[this.databaseTypes.length - 1]) {
              this.waitingInstallation = false;
              this.isLoadingDbs = false;
              this.generalService.hideLoading();
            }
          },
          error: (error: any) => { }
        })
    }
  }

  private clearServersideCache() {
    // Purging server side database cache in case user just recently created a new database.
    this.cacheService.delete('magic.sql.databases.*').subscribe({
      next: () => {},
      error: (error: any) => {}
    });
  }

  public viewAppDetails(item: any) {
    this.dialog.open(ViewDbComponent, {
      minWidth: '500px',
      data: item
    }).afterClosed().subscribe((res: string) => {
      if (res === 'uninstall') {
        this.uninstallDb(item.details);
      }
      if (res === 'install') {
        this.installDb(item);
      }
    })
  }

  public createNewDatabase() {
    this.sqlService.createDatabase(
      this.databaseType,
      this.connectionString,
      this.databaseName).subscribe({
        next: () => {
          this.generalService.showFeedback('Database successfully create', 'successMessage');
          this.getDatabases();
          this.databaseName = '';
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
      });
  }

  public viewItem(item: any) {
    // TODO: navigate to generated databases
    // to see all the tables.
  }

  ngOnDestroy(): void {
    /*
      * Making sure we turn OFF socket connections if these have been created.
      *
      * Notice, socket connections are NOT turned on for immediate downloads (free apps).
      */
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.generalService.hideLoading();
    }
  }
}
