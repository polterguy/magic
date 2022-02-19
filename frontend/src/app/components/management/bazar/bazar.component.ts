
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from './models/bazar-app.model';
import { AppManifest } from './models/app-manifest';
import { Response } from '../../../models/response.model';
import { Message } from 'src/app/models/message.model';
import { BazarService } from './services/bazar.service';
import { AuthService } from '../auth/services/auth.service';
import { FileService } from '../../files/services/file.service';
import { ConfigService } from '../config/services/config.service';
import { MessageService } from 'src/app/services/message.service';
import { NameEmailModel } from '../config/models/name-email.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ViewAppDialogComponent } from './view-app-dialog/view-app-dialog.component';
import { SubscribeDialogComponent } from './subscribe-dialog/subscribe-dialog.component';
import { ViewReadmeDialogComponent } from './view-readme-dialog/view-readme-dialog.component';
import { ViewInstalledAppDialogComponent } from './view-installed-app-dialog/view-installed-app-dialog.component';
import { LoaderService } from '../../app/services/loader.service';

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
  public installed: boolean = false;
  /*
   * Timer for displaying 'get help' message.
   */
  private timer: any = null;

  /*
   * Subscription for messages published by other components.
   */
  private subscription: Subscription;

  /**
   * If true, then filter form control should be hidden.
   */
  public hideFilterControl: boolean = true;

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app ise ready to be installed.
   */
  public hubConnection: HubConnection = null;

  /**
   * Apps as returned from Bazar.
   */
  public apps: BazarApp[] = [];

  /**
   * Number of items matching currently applied filter.
   */
  public count: number = 0;

  /**
   * Filter form control for filtering apps to display.
   */
  public filterFormControl: FormControl;

  /**
   * If too much time passes, we show the 'get help' message.
   */
  public timeout: boolean = false;

  /**
   * Manifests for already installed apps.
   */
  public manifests: AppManifest[] = null;

  /**
   * If true, the user has already subscribed to our newsletter.
   */
  public subscribing: boolean = false;

  /**
   * Paginator for paging apps.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user after app has been installed
   * @param dialog Needed to create modal dialogs
   * @param authService Needed to verify user is root
   * @param fileService Needed to be able to display README file after app has been installed.
   * @param bazarService Needed to retrieve apps from external Bazar server
   * @param configService Needed to compare versions semantically
   * @param activatedRoute Needed to retrieve activated router
   * @param messageService Needed to subscribe to messages published when app should be immediately installed
   * @param feedbackService Needed to display feedback to user
   * @param loaderService Needed to show loading when socket is connected
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    public authService: AuthService,
    private fileService: FileService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private loaderService: LoaderService) { 
      
      // checking params inside constructor, so it would be triggered whenever user enters the page
      // Notice onInit function would be triggered only once
      this.activatedRoute.queryParams.subscribe((pars: Params) => {
        // Checking if we've got "token" param.
        const token = pars['token'];
        if (token) {
          // show loading
          this.loaderService.show();
          this.dialog.open(ViewReadmeDialogComponent, {
            data: `<h1>Waiting ...</h1> <p class="mb-4">Please do not leave this page until the file is downloaded.<p>`,
          }).disableClose = true;
        }
      })
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    // Sanity checking that user is root.
    if (this.authService.isRoot) {

      // Retrieving Bazar items from main Bazar.
      this.getItems(true);

      /*
       * Checking if we've got a "token" query parameter,
       * at which point we've been redirected from PayPal,
       * after a successful purchase.
       */
      this.activatedRoute.queryParams.subscribe((pars: Params) => {

        // Checking if we've got "token" param.
        const token = pars['token'];
        if (token) {
          
          // Checking if product is already ready to be downloaded, and if not, subscribing to our SignalR message.
          this.waitForCallback(token);

          // Unless the process finishes in 3 minutes, we show a 'get help' message to the user.
          this.timer = setTimeout(() => {
            this.timeout = true;
          }, 180000);
        }
      });

      // Loading manifests from local server.
      this.loadManifests();
    }

    // Subscribing to messages from other components informing us we need to immediately install app.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Making sure this is the correct message.
      if (msg.name === 'magic.bazar.install-immediately') {

        // Yup, this is our guy - Installing app immediately.
        this.install(<BazarApp>msg.content.app, <string>msg.content.code);
      }
    });

    // Checking if user has already subscribed to newsletter.
    const subscribesStr = localStorage.getItem('subscribes-to-newsletter');
    if (subscribesStr && subscribesStr !== '') {
      const subObj = JSON.parse(subscribesStr);
      if (subObj.subscribing === true) {

        // User has already subscribed to newsletter.
        this.subscribing = true;
      }
    }
  }

  /**
   * Implementation of OnDestroy is necessary to make sure we
   * stop any SignalR connections once the dialog is closed.
   */
   public ngOnDestroy() {

    // Checking if we've got open SignalR connections.
    if (this.hubConnection) {

      // Stopping SignalR socket connection.
      this.hubConnection.stop();

      // hiding loader
      this.loaderService.hide();
    }

    // Destroying timer if it was created.
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Destroying subscription.
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when user wants to subscribe to our newsletter.
   */
  public subscribe() {

    // Opening up modal dialog passing in reference to Bazar app.
    let dialogRef = this.dialog.open(SubscribeDialogComponent, {
      width: '550px'
    });

    // Subscribing to afterClose such that we can hide email icon in case user subscribes.
    dialogRef.afterClosed().subscribe((model: NameEmailModel) => {

      // Checking if user chose to subscribe.
      if (model) {
        this.subscribing = true;
      }
    });
  }

  /**
   * Invoked when filter should be cleared.
   */
  public clearFilter() {

    // Just resetting the form control's value which will trigger debounce after some milliseconds.
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
   public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getItems();
  }

  /**
   * Invoked when a user clicks a specific app to view details about it.
   * 
   * @param app What app the user clicked
   */
  public viewApp(app: BazarApp) {

    // Checking if app is installed.
    if (this.appIsInstalled(app)) {
      this.feedbackService.showInfoShort('App is already installed');
      return;
    }

    // Opening up modal dialog passing in reference to Bazar app.
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
  public viewInstalledAppDetails(app: AppManifest) {

    // Opening up modal dialog passing in reference to app's manifest.
    const dialogRef = this.dialog.open(ViewInstalledAppDialogComponent, {
      data: app,
      width: '80%',
    });

    // Subscribing to afterClose such that we can check if app was updated, at which point we'll need to refresh manifests.
    dialogRef.afterClosed().subscribe((result: AppManifest) => {

      // app was updated, hence we need to refresh manifests.
      this.loadManifests();
    });
  }

  /**
   * Returns true if specified app is already installed.
   * 
   * @param app App to check
   */
  public appIsInstalled(app: BazarApp) {

    // Checking manifest apps to see if we can find this app in our currently installed apps.
    return this.manifests.filter(x => x.module_name === app.folder_name).length > 0;
  }

  /*
   * Private helper methods.
   */

  /*
   * Lists apps from Bazar server.
   */
  private getItems(first: boolean = false) {

    // Invoking service to retrieve available apps matching criteria.
    this.bazarService.listApps(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((apps: BazarApp[]) => {

      // Assigning result to model.
      this.apps = apps;

      // Retrieving number of items.
      this.bazarService.countApps(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning model.
        this.count = count.count;

        /*
         * Checking if this is our first invocation, at which point we hide filter form control
         * if there are fewer than 6 apps.
         */
        if (first) {
          this.hideFilterControl = this.count <= 5;
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Creates a SignalR subscriber that waits for the Bazar to publish a message verifying
   * that the payment has been accepted.
   */
  private waitForCallback(token: string) {
    // show loading
    this.loaderService.show();
    // Retrieving currently installing app from local storage.
    const app = <BazarApp>JSON.parse(localStorage.getItem('currently-installed-app'));
    localStorage.removeItem('currently-installed-app');

    // Creating our SignalR hub.
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
      
      // Purchase accepted by PayPal, hence starting download and installation process.
      this.install(app, token);
    });

    // Connecting SignalR connection.
    this.hubConnection.start().then(() => {

      /*
       * Notice, to avoid race conditions where PayPal actually invokes our webhook before
       * we're able to connect to SignalR socket, we'll need to actualyl check if product is already ready
       * for download here.
       */
      this.bazarService.appReady(token).subscribe((response: Response) => {

        // Checking result from Bazar server.
        if (response.result === 'APPROVED') {

          /*
           * PayPal already invoked our callback before we were able
           * to create our SignalR message subscriber.
           */
          this.install(app, token);
        }
      });
    });
  }

  /*
   * Invoked when app should be installed, which is only possible after
   * PayPal has accepted the payment from the user.
   */
  private install(app: BazarApp, token: string) {

    // Downloading app from Bazar.
    this.bazarService.download(app, token).subscribe((download: Response) => {

      // Verifying process was successful.
      if (download.result === 'success') {

        // Now invoking install which actually initialises the app, and executes its startup files.
        this.bazarService.install(
          app.folder_name,
          app.version,
          app.name,
          token).subscribe((install: Response) => {

          // Verifying process was successful.
          if (install.result === 'success') {

            // Success!
            this.feedbackService.showInfo('Module was successfully installed on your server');

            /*
             * Making sure we turn OFF socket connections if these have been created.
             *
             * Notice, socket connections are NOT turned on for immediate downloads (free apps).
             */
            if (this.hubConnection) {

              // Socket connection is open, turing it off.
              this.hubConnection.stop();
              this.hubConnection = null;

              // hide loading
              this.loaderService.hide();
              this.dialog.closeAll();
            }

            // Redirecting to main Bazar URL now that app has been installed on the local server.
            this.router.navigate(['/bazar']);

            // Reloading manifests now that we've installed an additional app.
            this.loadManifests();

            // Checking if app has a README file, at which point we display the entire file to the user.
            this.fileService.listFiles('/modules/' + app.folder_name + '/', 'README.md').subscribe((files: string[]) => {

              // Checking if above returned one main /modules/xxx/README.md file.
              const mainReadmeFilePath = files.filter(x => x === '/modules/' + app.folder_name + '/README.md');
              if (mainReadmeFilePath.length > 0) {

                /*
                 * Yup, module has a main README file, hence displaying it to
                 * the user in a modal window - But first we need to load the file's content.
                 */
                this.fileService.loadFile(mainReadmeFilePath[0]).subscribe((readMeFileContent: string) => {

                  // Displaying the file's content in a modal dialog.
                  this.dialog.open(ViewReadmeDialogComponent, {
                    data: readMeFileContent,
                  });

                }, (error: any) => this.feedbackService.showError(error));
              }

              // Downloading module to local computer.
              this.bazarService.downloadLocally(app.folder_name);

            }, (error: any) => this.feedbackService.showError(error));

          } else {

            // Oops, some unspecified error occurred
            this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
          }
        }, (error: any) => this.feedbackService.showError(error));

      } else {

        // Oops, some unspecified error occurred
        this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
      }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Loads manifests of installed apps from current installation.
   */
  private loadManifests() {

    // Invoking backend to load manifests.
    this.bazarService.localManifests().subscribe((manifests: AppManifest[]) => {

      // Assigning model.
      this.manifests = manifests || [];

      // Checking if any of the apps have available updates.
      let hasUpdates = false;
      for (const idx of this.manifests) {

        // Retrieving app from Bazar server.
        this.bazarService.getApp(idx.module_name).subscribe((result: BazarApp[]) => {

          // Making sure app is still available in Bazar, and if not, simply ignoring it.
          if (result && result.length > 0) {

            // Checking version of app, to see if we have an available update of it.
            const version = result[0].version;

            // Invoking local backend to do a comparison of currently installed app's version, and Bazar latest version.
            this.configService.versionCompare(idx.version, version).subscribe((versionCompare: any) => {

              /*
               * Checking if app has an update.
               *
               * Notice, if version comparison returned -1, this implies that the local version is
               * less than the current Bazar version, and hence app has an update in the Bazar.
               */
              if (+versionCompare.result === -1) {

                // App has an update.
                idx.has_update = true;
                idx.new_version = version;

                if (!hasUpdates) {
                  hasUpdates = true;
                  this.feedbackService.showInfo('You have apps that needs to be updated, scroll to the bottom to see the list of apps that needs updating');
                }
              }
            });
          }
        });
      }
    }, (error: any) => this.feedbackService.showError(error));
  }
}
