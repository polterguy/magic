
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { environment } from 'src/environments/environment';
import { FileService } from '../../../../../_general/services/file.service';
import { AppManifest } from '../../../../../_general/models/app-manifest';
import { ViewPluginDatabaseComponent } from './components/view-plugin-database/view-plugin-database.component';
import { SqlService } from '../../../../../_general/services/sql.service';
import { BazarService } from 'src/app/_general/services/bazar.service';
import { CacheService } from 'src/app/_general/services/cache.service';
import { ConfigService } from 'src/app/_general/services/config.service';
import { Databases } from 'src/app/_general/models/databases.model';
import { BazarApp } from 'src/app/models/bazar-app.model';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

/**
 * Helper component allowing you to manage your existing locally installed
 * SQLite databases.
 */
@Component({
  selector: 'app-manage-databases',
  templateUrl: './manage-databases.component.html',
  styleUrls: ['./manage-databases.component.scss']
})
export class ManageDatabasesComponent implements OnInit, OnDestroy {

  private appDetails: any = [];
  private hubConnection: HubConnection = null;

  displayedColumns: string[] = ['name', 'tables', 'actions'];
  databases: any = [];
  existingDatabases: any = [];
  waitingInstallation: boolean = false;
  currentStage: string = 'Preparing database to be downloaded.';
  isLoadingDbs: boolean = true;
  isLoadingPlugins: boolean = true;
  zipFileInput: any;
  databaseName: string = '';

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private fileService: FileService,
    private bazarService: BazarService,
    private cacheService: CacheService,
    private configService: ConfigService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.getDatabases();
  }

  createNewDatabase() {

    if (this.databaseName === '') {

      this.generalService.showFeedback('Please provide a name', 'errorMessage');
      return;
    }

    if (!this.CommonRegEx.appNameWithUppercaseHyphen.test(this.databaseName)) {

      this.generalService.showFeedback(this.CommonErrorMessages.appNameWithUppercaseHyphen, 'errorMessage');
      return;
    }

    this.generalService.showLoading();
    this.sqlService.createDatabase(
      'sqlite',
      'generic',
      this.databaseName).subscribe({
        next: () => {

          this.generalService.showFeedback('Database successfully created', 'successMessage');
          this.getDatabases();
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', -1)
        }
      });
  }

  viewPluginDatabaseDetails(item: any) {

    this.dialog.open(ViewPluginDatabaseComponent, {
      minWidth: '500px',
      data: item
    }).afterClosed().subscribe((res: string) => {

      if (res === 'uninstall') {
        this.uninstallPluginDatabase(item.details);
      }

      if (res === 'install') {
        this.installPluginDatabase(item);
      }
    });
  }

  installPluginDatabase(database: any) {

    this.generalService.showLoading();
    this.waitingInstallation = true;
    this.configService.rootUserEmailAddress().subscribe({
      next: (userDerails: any) => {

        this.bazarService.purchaseBazarItem(
          database,
          userDerails.name,
          userDerails.email,
          true,
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
      error: (error: any) => {

        this.generalService.hideLoading();
        this.waitingInstallation = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  uninstallPluginDatabase(database: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Uninstall database module`,
        description_extra: `You are uninstalling the following database module: <br/> <span class="fw-bold">${database?.name}</span> <br/><br/>This will not delete the database itself. Do you want to continue?`,
        action_btn: 'Uninstall',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        this.fileService.deleteFolder('/modules/' + database.module_name + '/').subscribe({
          next: () => {

            this.generalService.showFeedback(database.name + ' uninstalled successfully.', 'successMessage');
            this.getPluginDatabases();
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          }
        });
      }
    });
  }

  downloadDatabaseBackup(database: any) {
    this.fileService.downloadFile('/data/' + database.name + '.db');
  }

  uploadDatabaseBackup(file: any) {
    this.fileService.uploadDatabaseBackup(file.item(0)).subscribe({
      next: () => {
        this.generalService.showFeedback('Backup was successfully uploaded', 'successMessage');
        this.zipFileInput = null;
        this.getDatabases();
      },
      error: (error: any) => this.generalService.showFeedback(error)
    });
  }

  deleteDatabase(item: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${item.name}</span> <br/><br/>This action is permanent. Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `database name`,
          fieldToBeTypedValue: item.name,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.sqlService.dropDatabase(
          'sqlite',
          'generic',
          item.name).subscribe({
            next: () => {
              this.generalService.showFeedback('Database successfully deleted', 'successMessage');
              this.getDatabases();
              this.getPluginDatabases();
            },
            error: (error: any) => {
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            }});
      }
    });
  }

  ngOnDestroy() {
    this.hubConnection?.stop();
    this.generalService.hideLoading();
  }

  /*
   * Private helper methods
   */

  private getPluginDatabases() {

    this.bazarService.listBazarItems('SQLite%', 0, 5).subscribe({
      next: (apps: BazarApp[]) => {

        this.databases = apps || [];
        this.databases.map((item: any) => {
          item.hasUpdate = false;
        });
        this.loadLocalManifests();
        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private loadLocalManifests() {

    this.bazarService.localManifests().subscribe({
      next: (manifests: AppManifest[]) => {

        this.generalService.hideLoading();
        this.appDetails = manifests || [];
        this.isLoadingPlugins = false;
        if (manifests) {
          this.databases.map((db: any) => this.appDetails.map((manifest: any) => {
            if (db.name === manifest.name) {
              db.details = manifest;
            }
          }));
          manifests.forEach((manifest: any) => {
            this.getVersion(manifest.module_name, manifest.version);
          });
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private getVersion(module_name: string, appVersion: string) {

    this.bazarService.getBazarItem(module_name).subscribe({
      next: (res: BazarApp[]) => {

        if (res) {
          const database = this.databases.find((item: any) => item?.details?.module_name === module_name);
          if (database && this.configService.versionCompare(appVersion, res[0].version) === -1) {
            database.hasUpdate = true;
            database.newVersion = res[0].version;
          }
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private getDatabases() {

    this.existingDatabases = [];
    this.isLoadingDbs = true;
    this.sqlService.getDatabaseMetaInfo('sqlite', 'generic').subscribe({
        next: (res: Databases) => {

          res.databases.map((item: any) => {
            item.type = 'sqlite';
            item.connectionString = 'generic';
          });
          this.existingDatabases = [...this.existingDatabases, ...res.databases];

          this.waitingInstallation = false;
          this.isLoadingDbs = false;
          this.getPluginDatabases();
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
  }

  private downloadBazarItem(app: BazarApp, token: string) {

    this.currentStage = 'Downloading database';
    this.bazarService.downloadBazarItem(app, token).subscribe({
      next: (download: any) => {

        if (download.result === 'success') {
          this.currentStage = 'Installing database';
          this.bazarService.installBazarItem(app.folder_name, app.version, app.name, token).subscribe({
            next: (install: any) => {

              if (install.result === 'success') {
                this.generalService.showFeedback('Plugin was successfully installed on your cloudlet', 'successMessage');

                this.cacheService.delete('magic.sql.databases.sqlite.*').subscribe({
                  next: () => {
                    this.getDatabases();
                    this.loadLocalManifests();
                  },
                  error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
                });

                if (this.hubConnection) {
                  this.hubConnection.stop();
                  this.hubConnection = null;
                }

              } else {
                this.generalService.showFeedback('Oops! Please check the system log.', 'errorMessage', 'Ok', 5000);
              }
            },
            error: (error: any) => {

              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            }
          });
        } else {
          this.generalService.showFeedback('Oops! Please check the system log.', 'errorMessage', 'Ok', 5000);
        }
      },
      error: () => {

        this.hubConnection?.stop();
        this.hubConnection = null;
        this.generalService.hideLoading();
        this.waitingInstallation = false;
        this.generalService.showFeedback('Refresh the page and try again.', 'errorMessage')
      }
    });
  }

  private connectSocket(token: string, database: any) {

    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(environment.bazarUrl + '/sockets', {

      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    this.hubConnection.on('bazar.package.avilable.' + token, (args: string) => {

      this.downloadBazarItem(database, token);
    });

    this.hubConnection.start().then(() => {

      this.downloadBazarItem(database, token);
    });
  }
}
