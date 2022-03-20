
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Message } from 'src/app/models/message.model';
import { Response } from '../../../models/response.model';
import { BazarApp } from '../../../models/bazar-app.model';
import { AppManifest } from '../../../models/app-manifest';
import { environment } from 'src/environments/environment';
import { LoaderService } from '../../../services/loader.service';
import { FileService } from 'src/app/services/tools/file.service';
import { MessageService } from 'src/app/services/message.service';
import { NameEmailModel } from '../../../models/name-email.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BazarService } from '../../../services/management/bazar.service';
import { ConfigService } from '../../../services/management/config.service';
import { ViewAppDialogComponent } from './view-app-dialog/view-app-dialog.component';
import { SubscribeDialogComponent } from './subscribe-dialog/subscribe-dialog.component';
import { ViewReadmeDialogComponent } from './view-readme-dialog/view-readme-dialog.component';
import { ViewInstalledAppDialogComponent } from './view-installed-app-dialog/view-installed-app-dialog.component';

/**
 * Bazar component allowing you to obtain additional Micro Service backend
 * modules for your Magic installation.
 */
@Component({
  selector: 'app-bazar',
  templateUrl: './bazar.component.html',
  styleUrls: ['./bazar.component.scss']
})
export class BazarComponent implements OnInit, OnDestroy {

  /**
   * UI only
   * to filter apps based on their status
   */
  installed: boolean = false;

  /**
   * Timer for displaying 'get help' message.
   */
  timer: any = null;

  /**
   * Subscription for messages published by other components.
   */
  subscription: Subscription;

  /**
   * If true, then filter form control should be hidden.
   */
  hideFilterControl: boolean = true;

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app is ready to be installed.
   */
  hubConnection: HubConnection = null;

  /**
   * Apps as returned from Bazar.
   */
  apps: BazarApp[] = [];

  /**
   * Number of items matching currently applied filter.
   */
  count: number = 0;

  /**
   * Filter form control for filtering apps to display.
   */
  filterFormControl: FormControl;

  /**
   * If too much time passes, we show the 'get help' message.
   */
  timeout: boolean = false;

  /**
   * Manifests for already installed apps.
   */
  manifests: AppManifest[] = null;

  /**
   * If true, the user has already subscribed to our newsletter.
   */
  subscribing: boolean = false;

  /**
   * Paginator for paging apps.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user after app has been installed
   * @param dialog Needed to create modal dialogs
   * @param fileService Needed to be able to display README file after app has been installed.
   * @param bazarService Needed to retrieve apps from external Bazar server
   * @param configService Needed to compare versions semantically
   * @param backendService Needed to check if user is root
   * @param activatedRoute Needed to retrieve activated router
   * @param messageService Needed to subscribe to messages published when app should be immediately installed
   * @param feedbackService Needed to display feedback to user
   * @param loaderService Needed to show loading when socket is connected
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private fileService: FileService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private backendService: BackendService,
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private loaderService: LoaderService) {

    this.activatedRoute.queryParams.subscribe((pars: Params) => {
      const token = pars['token'];
      if (token) {
        this.loaderService.show();
        this.dialog.open(ViewReadmeDialogComponent, {
          data: `<h1 class="d-flex align-items-baseline">Please wait <div class="dot-flashing ml-4"></div></h1> <p class="mb-4">Please do not leave this page until your module has been installed and downloaded.<p>`,
        }).disableClose = true;
      }
    })
  }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    if (this.backendService.active?.token?.in_role('root')) {
      this.getItems(true);

      /*
       * Checking if we've got a "token" query parameter,
       * at which point we've been redirected from PayPal,
       * after a successful purchase.
       */
      this.activatedRoute.queryParams.subscribe((pars: Params) => {
        const token = pars['token'];
        if (token) {
          this.waitForCallback(token);
          this.timer = setTimeout(() => {
            this.timeout = true;
          }, 180000);
        }
      });

      this.loadManifests();
    }

    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'magic.bazar.install-immediately') {
        this.install(<BazarApp>msg.content.app, <string>msg.content.code);
      }
    });

    const subscribesStr = localStorage.getItem('subscribes-to-newsletter');
    if (subscribesStr && subscribesStr !== '') {
      const subObj = JSON.parse(subscribesStr);
      if (subObj.subscribing === true) {
        this.subscribing = true;
      }
    }
  }

  /**
   * Implementation of OnDestroy is necessary to make sure we
   * stop any SignalR connections once the dialog is closed.
   */
   ngOnDestroy() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.loaderService.hide();
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when user wants to subscribe to our newsletter.
   */
  subscribe() {
    let dialogRef = this.dialog.open(SubscribeDialogComponent, {
      width: '550px'
    });
    dialogRef.afterClosed().subscribe((model: NameEmailModel) => {
      if (model) {
        this.subscribing = true;
      }
    });
  }

  /**
   * Invoked when filter should be cleared.
   */
  clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
   paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getItems();
  }

  /**
   * Invoked when a user clicks a specific app to view details about it.
   * 
   * @param app What app the user clicked
   */
  viewApp(app: BazarApp) {
    if (this.appIsInstalled(app)) {
      this.feedbackService.showInfoShort('App is already installed');
      return;
    }
    this.dialog.open(ViewAppDialogComponent, {
      data: app,
      width: '80%'
    });
  }

  /**
   * Opens a modal dialog showing the user details about his already installed app.
   * 
   * @param app Which app to view details about
   */
  viewInstalledAppDetails(app: AppManifest) {
    const dialogRef = this.dialog.open(ViewInstalledAppDialogComponent, {
      data: app,
      width: '80%',
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadManifests();
    });
  }

  /**
   * Returns true if specified app is already installed.
   * 
   * @param app App to check
   */
  appIsInstalled(app: BazarApp) {
    return this.manifests.filter(x => x.module_name === app.folder_name).length > 0;
  }

  /*
   * Private helper methods.
   */

  /*
   * Lists apps from Bazar server.
   */
  private getItems(first: boolean = false) {
    this.bazarService.listBazarItems(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe({
        next: (apps: BazarApp[]) => {
          this.apps = apps;
          this.bazarService.countBazarItems(this.filterFormControl.value).subscribe({
            next: (count: Count) => {
              this.count = count.count;
              if (first) {
                this.hideFilterControl = this.count <= 5;
              }
            },
            error: (error: any) =>this.feedbackService.showError(error)});
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Creates a SignalR subscriber that waits for the Bazar to publish a message verifying
   * that the payment has been accepted.
   */
  private waitForCallback(token: string) {
    this.loaderService.show();
    const app = <BazarApp>JSON.parse(localStorage.getItem('currently-installed-app'));
    localStorage.removeItem('currently-installed-app');

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
      this.install(app, token);
    });

    this.hubConnection.start().then(() => {

      /*
       * Notice, to avoid race conditions where PayPal actually invokes our webhook before
       * we're able to connect to SignalR socket, we'll need to actualyl check if product is already ready
       * for download here.
       */
      this.bazarService.canDownloadBazarItem(token).subscribe({
        next: (response: Response) => {
          if (response.result === 'APPROVED') {

            /*
            * PayPal already invoked our callback before we were able
            * to create our SignalR message subscriber.
            */
            this.install(app, token);
          }
        },
        error: (error: any) =>this.feedbackService.showError(error)});
    });
  }

  /*
   * Invoked when app should be installed, which is only possible after
   * PayPal has accepted the payment from the user.
   */
  private install(app: BazarApp, token: string) {

    this.bazarService.downloadBazarItem(app, token).subscribe({
      next: (download: Response) => {
        if (download.result === 'success') {
          this.bazarService.installBazarItem(app.folder_name, app.version, app.name, token).subscribe({
            next: (install: Response) => {
              if (install.result === 'success') {
                this.feedbackService.showInfo('Module was successfully installed on your server');

                /*
                 * Making sure we turn OFF socket connections if these have been created.
                 *
                 * Notice, socket connections are NOT turned on for immediate downloads (free apps).
                 */
                if (this.hubConnection) {
                  this.hubConnection.stop();
                  this.hubConnection = null;
                  this.loaderService.hide();
                  this.dialog.closeAll();
                }

                this.router.navigate(['/bazar']);
                this.loadManifests();

                this.fileService.listFiles('/modules/' + app.folder_name + '/', 'README.md').subscribe({
                  next: (files: string[]) => {
                    const mainReadmeFilePath = files.filter(x => x === '/modules/' + app.folder_name + '/README.md');
                    if (mainReadmeFilePath.length > 0) {

                      /*
                       * Module has a main README file, hence displaying it to
                       * the user in a modal window - But first we need to load the file's content.
                       */
                      this.fileService.loadFile(mainReadmeFilePath[0]).subscribe({
                        next: (readMeFileContent: string) => {
                          this.dialog.open(ViewReadmeDialogComponent, {
                            data: readMeFileContent,
                          });
                        },
                        error:(error: any) => this.feedbackService.showError(error)});
                    }
                    this.bazarService.downloadBazarItemLocally(app.folder_name);
                  },
                  error: (error: any) => this.feedbackService.showError(error)});

            } else {
              this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
            }
          },
          error: (error: any) => this.feedbackService.showError(error)});
        } else {
          this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Loads manifests of installed apps from current installation.
   */
  private loadManifests() {

    this.bazarService.localManifests().subscribe({
      next: (manifests: AppManifest[]) => {
        this.manifests = manifests || [];
        let hasUpdates = false;
        for (const idx of this.manifests) {
          this.bazarService.getBazarItem(idx.module_name).subscribe({
            next: (result: BazarApp[]) => {
              if (result && result.length > 0) {
                const version = result[0].version;
                this.configService.versionCompare(idx.version, version).subscribe({
                  next: (versionCompare: any) => {
                    if (+versionCompare.result === -1) {
                      idx.has_update = true;
                      idx.new_version = version;
                      if (!hasUpdates) {
                        hasUpdates = true;
                        this.feedbackService.showInfo('You have apps that needs to be updated, scroll to the bottom to see the list of apps that needs updating');
                      }
                    }
                  },
                  error: (error: any) => this.feedbackService.showError(error)});
              }
            },
            error: (error: any) => this.feedbackService.showError(error)});
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
