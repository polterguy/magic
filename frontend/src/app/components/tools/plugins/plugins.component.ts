
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
import { BazarService } from '../../management/services/bazar.service';
import { Response } from '../../../models/response.model';
import { BazarApp } from '../../../models/bazar-app.model';
import { AppManifest } from '../../../models/app-manifest';
import { environment } from 'src/environments/environment';
import { ConfigService } from '../../../services--/config.service';
import { LoaderService } from '../../../services--/loader.service';
import { MessageService } from 'src/app/services--/message.service';
import { NameEmailModel } from '../../../models/name-email.model';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { PurchaseStatus } from 'src/app/models/purchase-status.model';
import { ViewAppDialogComponent } from './view-app-dialog/view-app-dialog.component';
import { SubscribeDialogComponent } from './subscribe-dialog/subscribe-dialog.component';
import { ViewReadmeDialogComponent } from './view-readme-dialog/view-readme-dialog.component';
import { ConfirmUninstallDialogComponent } from './confirm-uninstall-dialog/confirm-uninstall-dialog.component';
import { ViewInstalledAppDialogComponent } from './view-installed-app-dialog/view-installed-app-dialog.component';
import { ConfirmEmailAddressDialogComponent, EmailPromoCodeModel } from './view-app-dialog/confirm-email-address-dialog/confirm-email-address-dialog.component';

/**
 * Bazar component allowing you to obtain additional Micro Service backend
 * modules for your Magic installation.
 */
@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss']
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
   * Number of items to be displayed in each page.
   */
  public pageSize: number = 100;

  /**
   * Paginator for paging apps.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   *
   * @param router Needed to redirect user after app has been installed
   * @param dialog Needed to create modal dialogs
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
        if (this.filterFormControl.value.trim().length === 0 || this.filterFormControl.value.trim().length > 2) {
          this.filterFormControl.setValue(query);
          this.paginator.pageIndex = 0;
          this.getItems();
        }
      });

    if (this.backendService.active?.token?.in_role('root')) {
      (async () => {
        while (!this.paginator.pageSize)
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.paginator.pageSize) {
          this.getItems(true);
        }
      })();

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
    this.dialog.open(ViewAppDialogComponent, {
      data: {
        app: app,
        purchase: (app: BazarApp, after: () => void) => this.purchase(app, after)
      },
      width: '90%',
      maxWidth: '90vw',
      height: '90%',
      panelClass: ['details-dialog']
    });
  }

  /**
   * Invoked when user wants to purchase the specified app.
   */
  purchase(app: BazarApp, onAfter: () => void = null) {
    this.backendService.showObscurer(true);
    this.configService.rootUserEmailAddress().subscribe({
      next: (response: NameEmailModel) => {
        if (app.price === 0) {
          this.purchaseImplementation(
            app,
            response.name,
            response.email,
            null,
            false,
            onAfter);
        } else {
          const dialogRef = this.dialog.open(ConfirmEmailAddressDialogComponent, {
            width: '500px',
            data: {
              email: response.email,
              name: response.name,
              subscribe: true,
              code: app.price === 0 ? -1 : null
            }
          });
          dialogRef.afterClosed().subscribe((model: EmailPromoCodeModel) => {
            if (model) {
              this.purchaseImplementation(
                app,
                model.name,
                model.email,
                model.code,
                model.subscribe,
                onAfter);
            }
          });
        }

      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Opens a modal dialog showing the user details about his already installed app.
   *
   * @param app Which app to view details about
   */
  viewInstalledAppDetails(app: AppManifest) {
    let module = this.getInstalledApps().find((module: any) => app.name === module.name);
    const dialogRef = this.dialog.open(ViewInstalledAppDialogComponent, {
      data: module,
      width: '90%',
      maxWidth: '90vw'
    });
    dialogRef.afterClosed().subscribe((result: any) => {

      // Only if result is not undefined or null the user uninstalled the app, at which point we'll need to re-databind the form.
      if(result) {
        this.loadManifests();
      }
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

  /**
   * Returns all apps that are installed through the Bazar.
   *
   * @returns All apps installed from Bazar
   */
  getInstalledApps() {
    this.apps.map((x: any) => this.manifests.filter((item: any) => {
      if (item.name === x.name) {
        item.description = x.description;
        item.min_magic_version = x.min_magic_version;
      }
    }))
    return this.manifests.filter(x => x.token);
  }

  /**
   * Returns all apps that are installed through the Bazar.
   *
   * @returns All apps installed from Bazar
   */
  getUniInstalledApps() {
    if (this.manifests && this.manifests.length > 0) {
      return this.apps.filter((item: any) => !this.manifests.some((element: any) => item.name === element.name));
    } else {
      return this.apps;
    }
  }

  /**
   * Uninstalls the specified plugin.
   *
   * @param item Item to uninstall
   */
  uninstallPlugin(module_name: string) {

    this.dialog.open(ConfirmUninstallDialogComponent, {
      data: module_name,
      width: '500px'
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.loadManifests();
      }
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Purchase implementation method.
   */
  private purchaseImplementation(
    app: BazarApp,
    name: string,
    email: string,
    code: any,
    subscribe: boolean,
    onAfter: () => void) {
    this.bazarService.purchaseBazarItem(
      app,
      name,
      email,
      subscribe,
      code === -1 ? null : code).subscribe({
        next: (status: PurchaseStatus) => {

          // Making sure we show loading animation.
          this.loaderService.show();

          /*
           * Checking if status is 'PENDING' at which point we'll have to redirect to PayPal
           * to finish transaction.
           */
          if (status.status === 'PENDING') {

            /*
             * We'll need to redirect user to PayPal to accept the transaction.
             * Hence, storing currently viewed app in local storage to make it more
             * easily retrieved during callback.
             */
            localStorage.setItem('currently-installed-app', JSON.stringify(app));
            window.location.href = status.url;

          } else if (status.status === 'APPROVED') {

            /*
             * App can immediately be installed, and status.token contains
             * download token.
             */
            this.messageService.sendMessage({
              name: 'magic.bazar.install-immediately',
              content: {
                app: app,
                code: status.code,
              }
            });
            if (onAfter) {
              onAfter();
            }
          } else {
            this.feedbackService.showError(`Unknown status code returned from the Bazar, code was ${status.status}`);
            this.backendService.showObscurer(false);
          }
      },
      error: (error: any) => {
        this.feedbackService.showError(error);
        this.backendService.showObscurer(false);
      }});
  }

  /*
   * Lists apps from Bazar server.
   */
  private getItems(first: boolean = false) {
    this.bazarService.listBazarItems(
      '%' + this.filterFormControl.value + '%',
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe({
        next: (apps: BazarApp[]) => {
          this.apps = apps;
          this.bazarService.countBazarItems('%' + this.filterFormControl.value + '%').subscribe({
            next: (count: Count) => {
              this.count = count.count;
              if (first) {
                this.hideFilterControl = this.count <= 12;
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
                this.feedbackService.showInfo('Plugin was successfully installed on your server');

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

                this.router.navigate(['/plugins']);
                this.loadManifests();

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

    // Retrieving app manifests from local backend.
    this.bazarService.localManifests().subscribe({
      next: (manifests: AppManifest[]) => {
        this.manifests = manifests || [];
        let hasUpdates = false;

        // Iterating through each manifest and checking if app has update in Bazar API
        for (const idx of this.manifests) {
          this.bazarService.getBazarItem(idx.module_name).subscribe({
            next: (result: BazarApp[]) => {

              // Verifying app originated from Bazar API.
              if (result && result.length > 0) {
                const version = result[0].version;
                this.getUniInstalledApps();
                this.backendService.showObscurer(false);

                // Doing a version compare of the installed app and the latest version of app as published by Bazar API.
                // TODO: This is kind of stupid to do over an HTTP invocation, since it's just a string comparison
                // of two version numbers such as for instance "v5.6.7".
                this.configService.versionCompare(idx.version, version).subscribe({
                  next: (versionCompare: any) => {
                    if (+versionCompare.result === -1) {
                      idx.has_update = true;
                      idx.new_version = version;
                      if (!hasUpdates) {
                        hasUpdates = true;
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
