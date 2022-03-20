
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Router } from '@angular/router';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ToolbarHelpDialogComponent } from './toolbar-help-dialog/toolbar-help-dialog.component';
import { LoginDialogComponent } from 'src/app/components/app/login-dialog/login-dialog.component';

/**
 * Toolbar component for displaying toolbar that allows the
 * user to toggle the navbar, and login/logout of Magic.
 */
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  // checking for the sidenav status -- boolean
  @Input() sideNavStatus: boolean;

  /*
   * Help videos displayed when user clicks help.
   */
  private videos = [
    {name: '', url: 'rtK_Ie9E-cI'},
    {name: 'auth', url: 'I91IpNnqk8g'},
    {name: 'sql', url: 'NMH87k7Dv6c'},
    {name: 'crudifier', url: 'PMETvIk_EKg'},
    {name: 'endpoints', url: 'jwN32Ji6MVE'},
    {name: 'file-system', url: 'x2_2Uzb7h84'},
    {name: 'evaluator', url: 'S83qWxBAaNM'},
    {name: 'tasks', url: 'BnYr3s69_r0'},
    {name: 'crypto', url: 'mfQOTq7rMv4'},
    {name: 'diagnostics', url: 'nZ_yrw3MRS4'},
    {name: 'log', url: 'mjqvjy-lqnY'},
    {name: 'config', url: 'KkVUQk5eAPg'},
    {name: 'ide', url: 'jt8kETrE5EI'},
    {name: 'terminal', url: 'jt8kETrE5EI'},
    {name: 'sockets', url: 'xvnTCl_BnaE'},
    {name: 'about', url: 'lYcwpR72EN0'},
  ];

  /**
   * value for the theme, default is set to light
   */
  public theme: string;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to be able to display context sensitive help
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param backendService Service to keep track of currently selected backend
   * @param messageService Message service to send messages to other components using pub/sub
   * @param feedbackService Needed to show confirm dialog
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private overlayContainer: OverlayContainer) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // setting theme value, if user has set previously, otherwise is set to light 
    this.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
    this.overlayContainer.getContainerElement().classList.add(this.theme);
    /*
     * Publishing the message that will apply the currently selected theme.
     *
     * Notice, the setTimeout parts looks a bit silly, but are necessary in order
     * to avoid race conditions during initialization of other components on page ...
     */
    setTimeout(() => {
      this.messageService.sendMessage({
        name: Messages.THEME_CHANGED,
        content: this.theme,
      });
    }, 1);
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
    if (!this.backendService.active) {
      return 'not connected';
    }

    // Removing schema and port from URL.
    let url = this.backendService.active.url.replace('http://', '').replace('https://', '');
    if (url.indexOf(':') !== -1) {
      url = url.substring(0, url.indexOf(':'));
    }

    // Checking if user is authenticated.
    if (this.backendService.active?.token) {
      return this.backendService.active.username + ' / ' + url;
    } else if (this.backendService.active) {
      return 'anonymous / ' + url;
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.backendService.active?.token?.roles.join(', ') || '';
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  public login() {
    this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.backendService.logout(false);
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

  /**
   * Invoked when usert clicks the help icon.
   */
  public help() {

    // Retrieving currently activated route, which is component.
    const route = this.router.url.split('/')[1];
    const videos = this.videos.filter(x => x.name === route);
    if (videos.length === 0) {
      this.feedbackService.showInfoShort('No help video for this component');
      return;
    }
    const video = videos[0];

    const dismiss = localStorage.getItem('dismiss-warning');
    if (dismiss === 'true') {

      // Showing modal dialog with video.
      this.dialog.open(ToolbarHelpDialogComponent, {
        width: '617px',
        data: {
          video: `https://www.youtube.com/embed/${video.url}`
        }
      });

    } else {

      // Warning user about YouTube's lack of privacy.
      this.feedbackService.confirm(
        'Privacy Warning!',
        `<p>This will open YouTube in an iframe. YouTube is known for violating your privacy. Make sure you understand the implications of this before proceeding.</p>` +
        `<p>Alternatively, you might want to open the video directly in an anonymous browser window. The URL for the video is <a href="https://www.youtube.com/watch?${video.url}">https://www.youtube.com/watch?${video.url}</a> in case you want to watch it in privacy.</p>` +
        '<p>Do you wish to proceed anyway?</p>',
        () => {

          // Storing preferences for displaying warning.
          localStorage.setItem('dismiss-warning', 'true');

          // Showing modal dialog with video.
          this.dialog.open(ToolbarHelpDialogComponent, {
            width: '625px',
            data: {
              video: `https://www.youtube.com/embed/${video.url}`
            }
          });
      });
    }
  }
}
