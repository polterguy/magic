
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';
import { ThemeService } from 'src/app/services/theme.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../services/management/config.service';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  private subscriber: Subscription;

  /**
   * Helpers to determine how to show the navbar. If we're on a small screen, we show
   * it as an expandable only visible as hamburger button is clicked. Otherwise we
   * show it as a constant visible menu with the option of making it smaller bu clicking
   * a button.
   */
  getScreenWidth: number;
  smallScreenSize: number = 768;
  largeScreen: boolean = undefined;

  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.largeScreen = this.getScreenWidth >= this.smallScreenSize ? true : false;
    this.sidenavOpened = this.largeScreen;
  }

  /**
   * True if navigation menu is expanded.
   */
  sidenavOpened: boolean;
   
  /**
   * Backend version as returned from server if authenticated.
   */
  version: string = null;

   /**
    * Latest version of Magic as published by the Bazar.
    */
  bazarVersion: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user to main landing page if he logs out
   * @param messageService Message service to allow for cross component communication using pub/sub pattern
   * @param backendService Needed toverify we'reactuallyconnected to some backend before retrieving endpoints
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param configService Needed to check if system has been initially configured
   * @param themeService Needed to determine which theme we're using
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private router: Router,
    private messageService: MessageService,
    private backendService:BackendService,
    public loaderService: LoaderService,
    private configService: ConfigService,
    public themeService: ThemeService,
    private feedbackService: FeedbackService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.checkStatus();
    this.backendService.authenticatedChanged.subscribe(() => {
      this.checkStatus();
    });

    /**
     * Checking the screen width rule for initial setting
     */
    this.onWindowResize();

    /*
     * Subscribing to relevant messages published by other components
     * when wire frame needs to react to events occurring other places in our app.
     */
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {
      switch(msg.name) {

        // Some component wants to toggle the navbar
        case Messages.TOGGLE_NAVBAR:
          this.sidenavOpened = !this.sidenavOpened;
          localStorage.setItem('sidebar', this.sidenavOpened ? 'open' : 'close');
          break;

        // Some component wants to close the navbar
        case Messages.CLOSE_NAVBAR:
          this.sidenavOpened = false;
          localStorage.setItem('sidebar', 'close');
          break;
      }
    });

    // wait until sidebar status is defined based on the value stored in localstorage 
    (async () => {
      while (this.sidenavOpened === undefined)
        await new Promise(resolve => setTimeout(resolve, 100));

      this.sidenavOpened = !localStorage.getItem('sidebar') && this.largeScreen ? true : (localStorage.getItem('sidebar') === 'open' && this.largeScreen ? true : false);
    })();
  }

  /**
   * OnDestroy implementation.
   * 
   * Needed to unsubscribe to subscription registered in OnInit.
   */
  ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.sidenavOpened = false;
  }

  /*
   * Private helper methods.
   */

  /*
   * Checks setup status of system if user is authenticated and in root role,
   * and if system is not yet configured, redirects to '/config' route.
   */
  private checkStatus() {
    if (this.backendService.active?.token?.in_role('root')) {
      this.configService.status().subscribe({
        next: (config) => {
          this.configService.changeStatus(config.config_done && config.magic_crudified && config.server_keypair);
          if (!config.config_done || !config.magic_crudified || !config.server_keypair) {
            this.router.navigate(['/config']);
          }
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }
}
