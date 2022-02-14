
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { AuthService } from 'src/app/components/management/auth/services/auth.service';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { DiagnosticsService } from '../../../services/diagnostics.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../management/config/services/config.service';
import { BazarService } from '../../management/bazar/services/bazar.service';
import { OverlayContainer } from '@angular/cdk/overlay';

/**
 * Component wrapping navbar.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  public currentYear: number;

  /**
   * get navbar state as an input from app component
   */
  @Input() sideNavStatus: boolean;

  /**
   * get the screen size
   */
  @Input() notSmallScreen: boolean;

  /**
   * value for the theme, default is set to light
   */
   public theme: string;

  /**
   * If there exists a newer version of Magic Core as published by the Bazar,
   * this value will be true.
   */
   public shouldUpdateCore: boolean = false;
   
  /**
   * Backend version as returned from server if authenticated.
   */
   public version: string = null;

   /**
    * Latest version of Magic as published by the Bazar.
    */
   public bazarVersion: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Authentication and authorisation HTTP service
   * @param messageService Message service to send messages to other components using pub/sub
   * @param backendService Service to keep track of currently selected backend
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param diagnosticsService Needed to retrieve backend version
   * @param feedbackService Needed to provide feedback to user
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    public authService: AuthService,
    private messageService: MessageService,
    public backendService: BackendService,
    private dialog: MatDialog,
    private diagnosticsService: DiagnosticsService,
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private bazarService: BazarService,
    private overlayContainer: OverlayContainer) { }


  ngOnInit(): void {
    // Attempting to retrieve backend version.
    this.retrieveBackendVersion();

    this.currentYear = new Date().getFullYear();

    // setting theme value, if user has set previously, otherwise is set to light 
    this.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
    this.overlayContainer.getContainerElement().classList.add(this.theme);
  }

  /**
   * Toggles the navbar.
   */
  public toggleNavbar() {

    // Publishing message to inform other components that navbar was toggled.
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
  }

  /**
   * Returns the user's status to caller.
   */
   public getUserStatus() {

    // Verifying user is connected to a backend.
    if (!this.backendService.connected) {
      return 'not connected';
    }

    // Removing schema and port from URL.
    let url = this.backendService.current.url.replace('http://', '').replace('https://', '');
    if (url.indexOf(':') !== -1) {
      url = url.substr(0, url.indexOf(':'));
    }

    // Checking if user is authenticated.
    if (this.authService.authenticated) {
      return this.backendService.current.username + ' / ' + url;
    } else if (this.backendService.connected) {
      return 'anonymous / ' + url;
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
  }

  /**
   * Closes the navbar.
   */
  public closeNavbar() {
    this.messageService.sendMessage({
      name: Messages.CLOSE_NAVBAR
    });
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  public login() {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe(result => {
      this.authService.authenticated ? this.retrieveBackendVersion() : '';
    });
  }

   /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
  }

  /*
   * Retrieves backend version.
   */
  private retrieveBackendVersion() {

    // Retrieving backend version if we're authenticated.
    if (this.authService.isRoot) {

      // Invoking backend to retrieve version.
      this.diagnosticsService.version().subscribe((version: any) => {

        // Assigning model.
        this.version = version.version;

        // Invoking Bazar to check if we have the latest current version of Magic installed.
        this.bazarService.version().subscribe((result: Response) => {

          // Assigning model.
          this.bazarVersion = result.result;

          // Checking if Bazar version differs from current version.
          if (this.bazarVersion !== this.version) {

            // Invoking backend to check if Bazar version of Magic is higher than current version of Magic.
            this.configService.versionCompare(this.bazarVersion, this.version).subscribe((result: Response) => {

              /*
               * Checking return value of invocation, and if it was +1, the Bazar
               * claims there exists a newer version of the core.
               */
              if (+result.result === 1) {

                // Newer version exists according to Bazar.
                this.feedbackService.showInfo('There has been published an updated version of Magic. You should probably update your current version.');
                this.shouldUpdateCore = true;
              }
            });
          }

        }, (error: any) => this.feedbackService.showError(error));

      }, (error: any) => {
        this.authService.logout(false, false);
      });

    } else {

      // Unknown backend version since we're obviously not connected to any backend.
      this.version = '';
    }
  }

  /**
   * Invoked when theme is changed.
   */
   public themeChanged(value: string) {
    this.theme = value;
     
    // removing previously added class for dialogs
    this.overlayContainer.getContainerElement().classList.remove(localStorage.getItem('theme'));

    // Publishing message informing other components that active theme was changed.
    this.messageService.sendMessage({
      name: Messages.THEME_CHANGED,
      content: value,
    });

    // Persisting active theme to local storage.
    localStorage.setItem('theme', value);

    // setting new class based on the theme for dialogs
    this.overlayContainer.getContainerElement().classList.add(value);
  }
}
