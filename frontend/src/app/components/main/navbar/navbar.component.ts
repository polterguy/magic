
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { Backend } from 'src/app/models/backend.model';
import { ThemeService } from 'src/app/services/theme.service';
import { NavbarService } from 'src/app/services/navbar.service';
import { ConfigService } from '../../../services/config.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LoginDialogComponent } from '../../utilities/login-dialog/login-dialog.component';
import { IntroGuideComponent } from '../../utilities/intro-guide/intro-guide.component';

/**
 * Navbar component wrapping main navigation in dashboard.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {

  /**
   * Needed for copyright notice.
   */
  currentYear: number = new Date().getFullYear();

  /**
   * Get the screen size
   */
  @Input() largeScreen: boolean;

  /**
   * get theme for logo setting
   */
  public theme: string;

  /**
   * Creates an instance of your component.
   *
   * @param router Needed to redirect user after having verified his authentication token
   * @param backendService Service to keep track of currently selected backend
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param feedbackService Needed to provide feedback to user
   * @param configService Needed to check configuration status ofbackend
   * @param themeService Needed to determine which theme we're using and to allow user to change theme
   * @param navbarService Needed to be able to query and manipulate navbar status
   * @param clipboard Needed to copy URL of endpoint
   * @param cdRef Needed to mark component as having changes
   */
  constructor(
    private router: Router,
    public backendService: BackendService,
    private dialog: MatDialog,
    private feedbackService: FeedbackService,
    public configService: ConfigService,
    public themeService: ThemeService,
    public navbarService: NavbarService,
    private clipboard: Clipboard,
    private cdRef: ChangeDetectorRef) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.theme = this.themeService.theme;
    this.backendService.authenticatedChanged.subscribe(() => {
      this.cdRef.detectChanges();
    });
    this.backendService.activeBackendChanged.subscribe(() => {
      this.cdRef.detectChanges();
    });
    this.backendService.endpointsFetched.subscribe(() => {
      this.cdRef.detectChanges();
    });
    this.backendService.versionRetrieved.subscribe(() => {
      this.cdRef.detectChanges();
    });
    this.navbarService.expandedChanged.subscribe(() => {
      this.cdRef.detectChanges();
    });
  }

  /**
   * Toggles the navbar.
   */
  toggleNavbar() {
    this.navbarService.toggle();
  }

  /**
   * Returns the user's status to caller.
   */
  getActiveBackendUrl() {
    if (!this.backendService.active) {
      return 'not connected';
    }
    let url = this.backendService.active.url.replace('http://', '').replace('https://', '');
    return url;
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.navbarService.expanded = false;
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  login(allowAuthentication: boolean) {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '550px',
      data: {
        allowAuthentication
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if (!this.largeScreen) {
        this.closeNavbar();
      }
    });
  }

   /**
   * Logs the user out from his current backend.
   */
  logout() {
    this.backendService.logout(false);
    if (!this.largeScreen) {
      this.closeNavbar();
    }
    this.router.navigate(['/']);
  }

  /**
   * Invoked when theme is changed.
   */
  toggleTheme() {
    this.themeService.toggle();
    this.theme = this.themeService.theme;
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  copyUrlWithBackend(url: string) {
    const currentURL = window.location.protocol + '//' + window.location.host;
    const param = currentURL + '?backend='
    this.clipboard.copy(param + encodeURIComponent(url));
    this.feedbackService.showInfoShort('Backend URL was copied to your clipboard');
  }

  /**
   * Switching to specified backend.
   *
   * @param backend Backend to switch to
   */
  switchBackend(backend: Backend) {
    this.backendService.activate(backend);
    this.router.navigate(['/']);
  }

  /**
   * Removes specified backend from local storage
   *
   * @param backend Backend to remove
   */
  removeBackend(backend: Backend) {

    // For weird reasons the menu gets "stuck" unless we do this in a timer.
    setTimeout(() => this.backendService.remove(backend), 1);
  }

  public showHelp() {
    this.dialog.open(IntroGuideComponent, {
      width: '80%',
      height: '80%',
      panelClass: ['intro-panel']
    })
  }
}
