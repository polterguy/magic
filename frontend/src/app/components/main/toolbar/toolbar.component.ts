
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { ThemeService } from 'src/app/services--/theme.service';
import { NavbarService } from 'src/app/services--/navbar.service';
import { BackendService } from 'src/app/services--/backend.service--';

/**
 * Toolbar component for displaying toolbar that allows the
 * user to toggle the navbar, and login/logout of Magic.
 */
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  /**
   * Creates an instance of your component.
   *
   * @param themeService Needed to determine what theme we're currently using
   * @param navbarService Needed to allow for expanding and collapsing navbar
   * @param backendService Service to keep track of currently selected backend
   */
  constructor(
    public themeService: ThemeService,
    private navbarService: NavbarService,
    public backendService: BackendService) { }

  /**
   * Toggles the navbar.
   */
  toggleNavbar() {
    this.navbarService.toggle();
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
   * Returns roles user belongs to.
   */
  getUserRoles() {
    return this.backendService.active?.token?.roles.join(', ') || '';
  }
}
