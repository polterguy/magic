
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { environment } from 'src/environments/environment';
import { ConfigService } from '../../../../_general/services/config.service';
import { FileService } from '../../create/hyper-ide/services/file.service';
import { ViewPluginComponent } from './components/view-app/view-plugin.component';
import { AppManifest } from '../../../../_general/models/app-manifest';
import { CacheService } from 'src/app/_general/services/cache.service';
import { BazarService } from 'src/app/_general/services/bazar.service';
import { BazarApp } from 'src/app/models/bazar-app.model';

/**
 * Plugin component displaying available plugins that can be installed in the system.
 */
@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss']
})
export class PluginsComponent implements OnInit {

  public isLoading: boolean = true;

  public plugins: any = [];

  private appDetails: any = [];

  public waitingInstallation: boolean = false;

  public currentStage: string = 'Preparing plugin to be downloaded.';

  private hubConnection: HubConnection = null;

  public searchKey: string = null;
  public installedOnly: boolean = false;

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private cacheService: CacheService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private generalService: GeneralService) { }

  ngOnInit() {
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
          }));
          manifests.forEach((item: any) => {
            this.getVersion(item.module_name, item.version);
          })
          this.waitingInstallation = false;
        }
        this.isLoading = false;
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
        }
      },
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
    const plugins = this.plugins.find((item: any) => item?.details?.module_name === module_name);
    if (this.configService.versionCompare(appVersion, lastestVersion) === -1) {
      plugins.hasUpdate = true;
      plugins.newVersion = lastestVersion;
    }
  }

  public install(database: any) {
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
      this.getPlugin(database, token);
    });

    this.hubConnection.start().then(() => {
      this.getPlugin(database, token);
    });
  }

  /*
   * Invoked when app should be installed.
   */
  private getPlugin(app: BazarApp, token: string) {
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
  public uninstall(database: any) {
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
          next: () => {
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
        this.uninstall(item.details);
      }
      if (res === 'install') {
        this.install(item);
      }
    })
  }

  private clearServersideCache() {

    // Purging server side database cache in case user just recently created a new database.
    this.cacheService.delete('magic.sql.databases.*').subscribe({
      next: () => {},
    });
  }

  public filterList(event: { installedOnly: boolean, searchKey: string }) {
    this.installedOnly = event.installedOnly ?? false;
    this.searchKey = event.searchKey ?? null;
  }

  public getPluginsToDisplay() {
    return this.plugins.filter((x: any) => {
      if (this.installedOnly && !x.details) {
        return false;
      }
      if (this.searchKey && this.searchKey.length > 0 && x.name.toLowerCase().indexOf(this.searchKey.toLowerCase()) === -1) {
        return false;
      }
      return true;
    });
  }
}
