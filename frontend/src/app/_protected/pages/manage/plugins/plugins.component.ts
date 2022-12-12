
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BazarService } from 'src/app/_protected/services/common/bazar.service';
import { CacheService } from 'src/app/_protected/services/common/cache.service';
import { environment } from 'src/environments/environment';
import { ConfigService } from '../../settings/configuration/_services/config.service';
import { FileService } from '../../create/hyper-ide/_services/file.service';
import { ViewPluginComponent } from './components/view-app/view-plugin.component';
import { AppManifest } from './_models/app-manifest';
import { BazarApp } from './_models/bazar-app.model';

@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss']
})
export class PluginsComponent implements OnInit {

  public isLoading: boolean = true;

  private originalPlugins: any = [];
  public plugins: any = [];

  private appDetails: any = [];

  public waitingInstallation: boolean = false;

  public currentStage: string = 'Preparing plugin to be downloaded.';

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app is ready to be installed.
   */
  private hubConnection: HubConnection = null;

  public searchKey: Observable<string>;

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private cacheService: CacheService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getItems();
  }

  /*
   * Lists apps from Bazar server.
   */
  private getItems() {
    this.bazarService.listBazarItems('%%', 0, 1000).subscribe({
      next: (apps: BazarApp[]) => {
        this.plugins = apps;
        this.loadDetails();
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
          this.plugins.map((item: any) => this.appDetails.map((el: any) => {
            if (item.name === el.name) {
              item.details = el;
            }
          }))
          manifests.forEach((item: any) => {
            this.getVersion(item.module_name, item.version);
          })
          this.waitingInstallation = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
          // this.backendService.showObscurer(false);
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
    if (this.plugins) {
      const item = this.plugins.find((item: any) => item?.details?.module_name === module_name);
      this.configService.versionCompare(appVersion, lastestVersion).subscribe({
        next: (versionCompare: any) => {
          if (+versionCompare.result === -1) {
            if (item) {
              item.hasUpdate = true;
              item.newVersion = lastestVersion;
            }
          }
          this.originalPlugins = [...this.plugins];
          this.isLoading = false;
        },
        error: (error: any) => { }
      });

    }
  }

  public installDb(database: any) {
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

  /*
   * Invoked when app should be installed.
   */
  private getDb(app: BazarApp, token: string) {
    this.currentStage = 'Downloading plugin';
    this.bazarService.downloadBazarItem(app, token).subscribe({
      next: (download: any) => {
        if (download.result === 'success') {
          this.currentStage = 'Installing plugin';
          this.bazarService.installBazarItem(app.folder_name, app.version, app.name, token).subscribe({
            next: (install: any) => {
              if (install.result === 'success') {
                this.generalService.showFeedback('Plugin was successfully installed on your server', 'successMessage');

                this.loadDetails();
                this.cacheService.delete('magic.sql.databases.sqlite.*').subscribe();

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
          },
          error: (error: any) => { this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage') }
        });
      }
    })
  }

  public viewAppDetails(item: any) {
    this.dialog.open(ViewPluginComponent, {
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

  private clearServersideCache() {
    // Purging server side database cache in case user just recently created a new database.
    this.cacheService.delete('magic.sql.databases.*').subscribe({
      next: () => { },
      error: (error: any) => { }
    });
  }

  public filterList(event: { installedOnly: boolean, searchKey: string }) {
    if (event?.searchKey !== '' || event.installedOnly === true) {
      if (event.installedOnly) {
        this.plugins = this.originalPlugins.filter((item: any) => item.name.toLowerCase().indexOf(event?.searchKey.toLowerCase()) > -1 && item.details);
      } else {
        this.plugins = this.originalPlugins.filter((item: any) => item.name.toLowerCase().indexOf(event?.searchKey.toLowerCase()) > -1)
      }
    } else {
      if (event.installedOnly) {
        this.plugins = this.originalPlugins.filter((item: any) => item.details);
      } else {
        this.plugins = this.originalPlugins;
      }
    }
  }
}
