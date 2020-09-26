import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Base class for all "data-grid" components,
 * displaying items to perform CRUD operations.
 */
export abstract class GridComponent {

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

  /**
   * Constructor for grid component, taking a couple of services using dependency injection.
   * 
   * @param snackBar Snack bar to use to display errors, and general information
   * @param jwtHelper Helper service to parse JWT token, to retrieve roles user belongs to, if any
   */
  constructor(
    protected snackBar: MatSnackBar,
    protected jwtHelper: JwtHelperService) {

    const token = localStorage.getItem('jwt_token');
    if (token) {
      if (this.jwtHelper.isTokenExpired(token)) {
        localStorage.removeItem('jwt_token');
      } else {
        this.roles = this.jwtHelper.decodeToken(token).role.split(',');
        setTimeout(() => this.tryRefreshTicket(), 300000);
      }
}

  /**
   * Abstract method you'll need to override to actually return method that
   * returns observable for retrieving items.
   */
  protected abstract getItems(filter: any) : Observable<any>;

  /**
   * Abstract method you'll have to override to actually return method that
   * returns observable for counting items.
   */
  protected abstract getCount(filter: any) : Observable<any>;

  /**
   * Abstract method you'll have to override to actually return method that
   * returns observable for deleting a single item.
   * 
   * @param ids Primary keys for item
   */
  protected abstract getDelete(ids: any) : Observable<any>;

  /**
   * Abstract method necessary to implement to make sure paginator
   * gets reset when needed.
   */
  protected abstract resetPaginator() : void;

  /**
   * Returns data items from backend.
   * 
   * @param countRecords Whether or not we should also retrieve and update count of records
   */
  protected getData(countRecords: boolean = true) {

    this.viewDetails = [];

    this.getItems(this.filter).subscribe((items: any) => {
      this.data = items || [];

      if (countRecords) {

        const filterCount = {};
        for (const idx in this.filter) {
          if (Object.prototype.hasOwnProperty.call(this.filter, idx)) {
            switch (idx) {
              case 'limit':
              case 'offset':
              case 'order':
              case 'direction':
                break; // Ignoring
              default:
                filterCount[idx] = this.filter[idx];
                break;
            }
          }
        }

        this.getCount(filterCount).subscribe(count => {
          this.count = count.count;
        }, (error: any) => this.showError(error));
      }
    }, (error: any) => this.showError(error));
  }

  /**
   * Invoked when an entity is deleted. Invokes HTTP service that deletes item from backend.
   * 
   * @param entity Entity to delete
   * @param ids Primary keys for entity
   */
  public delete(entity: any, ids: any) {

    let hasKeys = false;
    for (const idx in ids) {
      if (ids.hasOwnProperty(idx)) {
        hasKeys = true;
        break;
      }
    }
    if (!hasKeys) {
      this.showError('Your endpoint does not accept any primary keys, and hence deletion of individual entities becomes impossible');
      return;
    }

    this.getDelete(ids).subscribe(deleteResult => {

      if (deleteResult['deleted-records'] !== 1) {
        this.showError(`For some reasons ${deleteResult['deleted-records']} records was deleted, and not 1 as expected!`);
      }

      const indexOf = this.viewDetails.indexOf(entity);
      if (indexOf !== -1) {
        this.viewDetails.splice(indexOf, 1);
      }

      this.getData();
    }, (error: any) => this.showError(error));
  }

  /**
   * Sorts according to the specified column.
   * 
   * @param column Which column to sort by
   */
  public sort(column: string) {
    if (this.filter.order === column) {
      this.filter.direction =
        this.filter.direction === 'asc' ||
        this.filter.direction === null ||
        this.filter.direction === undefined ?
          'desc' :
          'asc';
    } else {
      this.filter.order = column;
      this.filter.direction = 'asc';
    }
    this.resetPaginator();
    this.filter.offset = 0;
    this.getData(false);
  }

  /**
   * Checks to see if currently logged in user belongs to any of the specified roles
   * 
   * @param roles Which roles to check if user exists within
   */
  public inRole(roles: string[]) {
    if (!roles || roles.length === 0) {
      return true; // This part doesn't require authentication
    }
    for (const idx of roles) {
      if (this.roles.indexOf(idx) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the necessary edit data for given entity, used to open
   * modal dialog.
   * 
   * @param entity Entity to return edit data for.
   */
  protected getEditData(entity: any) {
    const data = {
      isEdit: true,
      entity: {},
    };
    for (const idx in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, idx)) {
        data.entity[idx] = entity[idx];
      }
    }
    return data;
  }

  /**
   * Updates the specified destination entity, with the values from the
   * source entity.
   * 
   * @param srcEntity Entity containing new and potentially modified data for entity
   * @param destEntity Original entity, which is the entity method will update
   */
  protected setEditData(srcEntity: any, destEntity: any) {

    if (srcEntity) {
      for (const idx in srcEntity) {
        if (Object.prototype.hasOwnProperty.call(srcEntity, idx)) {
          destEntity[idx] = srcEntity[idx];
        }
      }
      this.snackBar.open('Item successfully updated', 'Close', {
        duration: 2000,
      });
    }
  }

  /**
   * Invoked when an item was successfully created.
   * 
   * @param createResult Result from modal dialog
   */
  protected itemCreated(createResult: any) {
    if (createResult) {
      this.getData();
      this.snackBar.open('Item successfully created', 'Close', {
        duration: 2000,
      });
    }
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
   * Invoked when pager is paged.
   * 
   * @param e Paging event
   */
  public paged(e: PageEvent) {
    this.viewDetails = [];
    if (this.filter.limit !== e.pageSize) {
      this.filter.limit = e.pageSize;
      this.resetPaginator()
      this.filter.offset = 0;
    } else {
      this.filter.offset = e.pageIndex * e.pageSize;
    }
    this.getData(false);
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
  public shouldDisplayDetails(entity: any) {
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
