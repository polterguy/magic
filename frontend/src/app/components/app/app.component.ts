
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Router } from '@angular/router';
import { 
  Component,
  HostListener,
  OnInit
} from '@angular/core';

// Application specific imports.
import { ThemeService } from 'src/app/services/theme.service';
import { LoaderService } from 'src/app/services/loader.service';
import { NavbarService } from 'src/app/services/navbar.service';
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
export class AppComponent implements OnInit {

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
    if (!this.largeScreen) {
      this.navbarService.expanded = false;
    }
  }

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user to main landing page if he logs out
   * @param backendService Needed toverify we'reactuallyconnected to some backend before retrieving endpoints
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param navbarService Navbar service keeping track of state of navbar
   * @param configService Needed to check if system has been initially configured
   * @param themeService Needed to determine which theme we're using
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private router: Router,
    private backendService:BackendService,
    public loaderService: LoaderService,
    public navbarService: NavbarService,
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
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.navbarService.expanded = false;
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
