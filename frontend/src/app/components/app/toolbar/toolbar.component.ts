
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { ThemeService } from 'src/app/services/theme.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';

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

  /**
   * Creates an instance of your component.
   * 
   * @param themeService Needed to determine what theme we're currently using
   * @param backendService Service to keep track of currently selected backend
   * @param messageService Message service to send messages to other components using pub/sub
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    public themeService: ThemeService,
    public backendService: BackendService,
    private messageService: MessageService,
    private overlayContainer: OverlayContainer) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.overlayContainer.getContainerElement().classList.add(this.themeService.theme);
  }

  /**
   * Toggles the navbar.
   */
  toggleNavbar() {
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
  }

  /**
   * Returns the user's status to caller.
   */
  getUserStatus() {

    if (!this.backendService.active) {
      return 'not connected';
    }

    let url = this.backendService.active.url.replace('http://', '').replace('https://', '');
    if (url.indexOf(':') !== -1) {
      url = url.substring(0, url.indexOf(':'));
    }

    if (this.backendService.active?.token) {
      return this.backendService.active.username + ' / ' + url;
    } else if (this.backendService.active) {
      return 'anonymous / ' + url;
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  getUserRoles() {
    return this.backendService.active?.token?.roles.join(', ') || '';
  }
}
