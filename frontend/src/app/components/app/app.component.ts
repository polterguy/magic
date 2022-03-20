
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { 
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { ThemeService } from 'src/app/services/theme.service';
import { LoaderService } from 'src/app/services/loader.service';
import { NavbarService } from 'src/app/services/navbar.service';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  // Needed to be able to figure out if we're on a small screen or not.
  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    const getScreenWidth = window.innerWidth;
    this.largeScreen = getScreenWidth >= 768 ? true : false;
    if (!this.largeScreen) {
      this.navbarService.expanded = false;
    }
  }

  /**
   * Helper to determine how to show the navbar. If we're on a small screen, we show
   * it as an expandable only visible as hamburger button is clicked. Otherwise we
   * show it as a constant visible menu with the option of making it smaller bu clicking
   * a button.
   */
  largeScreen: boolean;

  /**
   * Creates an instance of your component.
   * 
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param router Needed to redirect user as he or she logs out
   * @param navbarService Navbar service keeping track of state of navbar
   * @param themeService Needed to determine which theme we're using
   * @param backendService Needed such that we can subscribe to authentication events
   */
  constructor(
    public loaderService: LoaderService,
    private router: Router,
    public navbarService: NavbarService,
    public themeService: ThemeService,
    private backendService: BackendService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {

    // Checking the screen width rule for initial setting
    this.onWindowResize();

    // Making sure we redirect to root URL when user logs out.
    this.backendService.authenticatedChanged.subscribe((authenticated: boolean) => {
      if (!authenticated) {
        this.router.navigate(['/']);
      }
    });

    // Subscribing to status changes and redirect accordingly if we need user to setup system.
    this.backendService.statusRetrieved.subscribe((status: Status) => {
      if (status) {
        if (!status.config_done || !status.magic_crudified || !status.server_keypair) {
          this.router.navigate(['/config']);
        }
      }
    });
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.navbarService.expanded = false;
  }
}
