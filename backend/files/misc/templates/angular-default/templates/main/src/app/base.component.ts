import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';

/**
 * Base class for all "data-grid" components, diisplaying items to perform CRUD operations.
 */
export class BaseComponent {

  // List of roles user authenticated belongs to.
  private roles: string [] = [];

  /**
   * Number of milliseconds after a keystroke before filtering should be re-applied.
   */
  protected debounce = 400;

  /**
   * Actual data currently displayed in the grid. The mat-table will be databound to this list.
   */
  public data: any[];

  /**
   * Number of items our backend reports are available in total, matching our filter condition.
   */
  public count = 0;

  /**
   * If true, the grid has been filtered.
   */
  public hasFiltered = false;

  /**
   * Current filter being applied to filter items from our backend.
   */
  public filter: any = {
    limit: 10
  };

  /**
   * List of items we're currently viewing details for.
   */
  public viewDetails: any[] = [];

  constructor(
    protected snackBar: MatSnackBar,
    protected jwtHelper: JwtHelperService)
  {
    // Checking if user is logged in, at which point we initialize the roles property.
    const token = localStorage.getItem('jwt_token');
    if (token !== null && token !== undefined) {

      // Yup! User is logged in!
      this.roles = this.jwtHelper.decodeToken(token).role.split(',');
    }
  }

  /**
   * Checks to see if currently logged in user belongs to any of the specified roles
   * 
   * @param roles Which roles to check if user exists within
   */
  public inRole(roles: string[]) {
    for (const idx of roles) {
      if (this.roles.indexOf(idx) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if the pager should be shown.
   */
  public showPager() {
    if (this.hasFiltered || this.count > 10) {
      return true;
    }
    return false;
  }

  /**
   * Returns the class for the header row, which will only be visible
   * if there are more than 20 records in dataset, before filtering has been applied.
   */
  public getHeaderRowClass() {
    if (this.showPager()) {
      return 'show-pager';
    }
    return 'hide-pager';
  }

  /**
   * Returns CSS class name for a specific table row (tr element).
   * Notice, the CSS class is changed according to whether or not the details
   * window is visible or not.
   * 
   * @param entity Entity to retrieve view-details CSS class for
   */
  public getClassForRecord(entity: any) {
    if (this.viewDetails.indexOf(entity) !== -1) {
      return 'grid-row visible-details';
    }
    return 'grid-row';
  }

  /**
   * Returns the CSS class for the "view details" parts.
   * Notice, this basically ensures that the "view details" is invisible, unless
   * explicitly shown by the user choosing to view the details for a record.
   * 
   * @param entity Entity to retrieve CSS class for showing details for
   */
  public getClassForDetails(entity: any) {
    if (this.viewDetails.indexOf(entity) !== -1) {
      return 'details-row visible';
    }
    return 'details-row hidden';
  }

  /**
   * Returns the sorting icon for the specified column.
   * 
   * @param column Column to retrieve icons for
   */
  public getSortIcon(column: string) {
    if (this.filter.order !== column) {
      return 'sort_by_alpha';
    }
    if (this.filter.direction === 'asc') {
      return 'keyboard_arrow_down';
    } else {
      return 'keyboard_arrow_up';
    }
  }

  /**
   * Toggles displaying of details for a specific entity in the data-grid.
   * 
   * @param entity Entity to toggle details view for
   */
  public toggleDetails(entity: any) {
    const indexOf = this.viewDetails.indexOf(entity);
    if (indexOf === -1) {
      this.viewDetails.push(entity);
    } else {
      this.viewDetails.splice(indexOf, 1);
    }
  }

  /**
   * Returns true if we should display the details view for a specific entity or not.
   * 
   * @param entity Entity to check if we should display details view for
   */
  shouldDisplayDetails(entity: any) {
    if (this.viewDetails.indexOf(entity) !== -1) {
      return true;
    }
    return false;
  }

  /**
   * Shows an HTTP error, or some other error
   * 
   * @param error HTTP error or normal error to display.
   */
  protected showError(error: any) {
    this.snackBar.open(
      error?.error?.message ||
        (error.status ? error.status + ' - ' + error.statusText : error),
      'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
