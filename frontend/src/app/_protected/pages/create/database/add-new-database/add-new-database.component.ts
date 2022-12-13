
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/backend.service';
import { BazarService } from 'src/app/_protected/services/bazar.service';
import { ConfigService } from 'src/app/_protected/services/config.service';
import { environment } from 'src/environments/environment';
import { FileService } from '../../hyper-ide/_services/file.service';
import { AppManifest } from '../../../manage/plugins/_models/app-manifest';
import { BazarApp } from '../../../manage/plugins/_models/bazar-app.model';
import { ViewDbComponent } from '../components/view-db/view-db.component';
import { Databases } from '../_models/databases.model';
import { DefaultDatabaseType } from '../_models/default-database-type.model';
import { SqlService } from '../_services/sql.service';
import { CacheService } from 'src/app/_protected/services/cache.service';

@Component({
  selector: 'app-add-new-database',
  templateUrl: './add-new-database.component.html',
  styleUrls: ['./add-new-database.component.scss']
})
export class AddNewDatabaseComponent implements OnInit, OnDestroy {

  @Output() dbTypes: EventEmitter<string[]> = new EventEmitter<string[]>();

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
  public zipFileInput: any;

  /**
   * The following variables are for creating a new db.
   */
  public dbTypeList: any = [];
  public cStringList: any = '';
  public selectedCString: string = '';
  public databaseName: string = '';
  public waitingCreation: boolean = false;

  public defaultDbType: string = '';

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app is ready to be installed.
   */
  private hubConnection: HubConnection = null;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private fileService: FileService,
    private bazarService: BazarService,
    private cacheService: CacheService,
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
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage'),
      complete: () => this.loadDetails()
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
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage'),
      complete: () => {
        if (this.appDetails.length === 0) {
          this.isLoadingPlugins = false;
        }
      }
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
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
              this.generalService.hideLoading();
              this.waitingInstallation = false;
            }
          });
      },
      error: () => {
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

  /**
   * Downloads a backup of the currently selected SQLite database
   */
  downloadBackup(database: any) {
    this.fileService.downloadFile('/data/' + database.name + '.db');
  }

  uploadBackup(file: any) {
    this.fileService.uploadDatabaseBackup(file.item(0)).subscribe({
      next: () => {
        this.generalService.showFeedback('Backup was successfully uploaded', 'successMessage');
        this.zipFileInput = null;
        this.getDatabases();
      },
      error: (error: any) => this.generalService.showFeedback(error)
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

                this.cacheService.delete('magic.sql.databases.sqlite.*').subscribe({
                  next: () => {
                    this.getDatabases();
                    this.loadDetails();
                  }
                })

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
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
        title: `Uninstall module`,
        description_extra: `You are uninstalling the following database module: <br/> <span class="fw-bold">${database?.name}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Uninstall',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.fileService.deleteFolder('/modules/' + database.module_name + '/').subscribe({
          next: () => {
            this.generalService.showFeedback(database.name + ' uninstalled successfully.', 'successMessage');
            this.getItems();
          },
          error: (error: any) => { this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage') }
        });
      }
    })
  }

  public deleteDb(item: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${item.name}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `Database name`,
          fieldToBeTypedValue: item.name,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.sqlService.dropDatabase(
          this.databaseType,
          this.connectionString,
          item.name).subscribe({
            next: () => {
              this.generalService.showFeedback('Database successfully deleted', 'successMessage');
              this.getDatabases();
              this.getItems();
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
        this.dbTypes.emit(this.databaseTypes);
        this.getConnectionString(dbTypes.default);
        this.defaultDbType = dbTypes.default;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
          this.databaseType = dbType;
          // this.cStringList = connectionStrings;
          // this.selectedCString = Object.keys(connectionStrings)[0];
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
    this.existingDatabases = [];
    this.isLoadingDbs = true;
    this.sqlService.getDatabaseMetaInfo(
      this.defaultDbType,
      this.connectionString).subscribe({
        next: (res: Databases) => {
          res.databases.map((item: any) => {
            item.type = this.defaultDbType;
            item.connectionString = this.connectionString;
          });
          this.existingDatabases = [...this.existingDatabases, ...res.databases];

          // Makes difference only after a successful installation.

          this.waitingInstallation = false;
          this.isLoadingDbs = false;
          this.generalService.hideLoading();
        },
        error: (error: any) => { }
      })
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
    if (this.databaseName === '') {
      this.generalService.showFeedback('Please provide a name.', 'errorMessage');
      return;
    }
    this.waitingCreation = true;
    this.sqlService.createDatabase(
      this.defaultDbType,
      this.connectionString,
      this.databaseName).subscribe({
        next: () => {
          this.generalService.showFeedback('Database successfully created', 'successMessage');
          this.getDatabases();
          this.databaseName = '';
          this.waitingCreation = false;
        },
        error: (error: any) => {
          this.waitingCreation = false;
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', -1)
        }
      });
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
