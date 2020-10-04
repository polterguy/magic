// Angular imports
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { OnDestroy } from '@angular/core';

// Custom services and models your app depends upon.
import { Message, Messages, MessageService } from 'src/app/services/message-service';
import { DeleteResponse } from '../services/models/delete-response';
import { CountResponse } from '../services/models/count-response';
import { Endpoint } from '../services/models/endpoint';

/**
 * Base class for all "data-grid" components, displaying items to
 * perform CRUD operations in a Material table, applying live filtering,
 * sorting, paging, etc.
 */
export abstract class GridComponent implements OnDestroy {

  // List of roles user authenticated belongs to.
  private roles: string [] = [];

  // All endpoints in system.
  private endpoints: Endpoint[] = [];

  // Used to subscribe to events triggered by other parts of the system.
  private subscription: Subscription;

  /**
   * Number of milliseconds after a keystroke before
   * filtering should be re-applied.
   */
  protected debounce = 400;

  /**
   * Actual data currently displayed in the grid.
   * The Material table will be databound to this list.
   */
  public data: any[];

  /**
   * Number of items our backend reports are available in total,
   * that is matching our filter condition.
   */
  public itemsCount = 0;

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
   * @param messages Message service used to subscribe to events, and publish events, to communicate with other components in the system
   * @param snackBar Snack bar to use to display errors, and also general information
   */
  constructor(
    protected messages: MessageService,
    protected snackBar: MatSnackBar) { }

  /**
   * Invoked by derived class' OnInit implementation.
   * 
   * Retrieves current user's roles, if authenticated,
   * and subscribes to a couple of events, making sure we update UI accordingly,
   * as state changes in other parts of the app.
   */
  protected initCommon() {

    this.roles = <string[]>this.messages.getValue(Messages.GET_ROLES);
    this.endpoints = <Endpoint[]>this.messages.getValue(Messages.GET_ENDPOINTS);

    // When user logs in/out, we'll need to re-databind the mat-table.
    this.subscription = this.messages.subscriber().subscribe((msg: Message) => {

      switch (msg.name) {

        case Messages.LOGGED_IN:
          this.roles = <string[]>this.messages.getValue(Messages.GET_ROLES);
          this.getData(true);
          break;

        case Messages.LOGGED_OUT:
          this.roles = [];
          this.getData(true);
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Abstract method you'll need to override to actually return URL of
   * CRUD methods.
   */
  protected abstract url() : string;

  /**
   * Abstract method you'll need to override to actually return method that
   * returns observable for retrieving items.
   */
  protected abstract read(filter: any) : Observable<any[]>;

  /**
   * Abstract method you'll have to override to actually return method that
   * returns observable for counting items.
   */
  protected abstract count(filter: any) : Observable<CountResponse>;

  /**
   * Abstract method you'll have to override to actually return method that
   * returns observable for deleting a single item.
   * 
   * @param ids Primary keys for item
   */
  protected abstract delete(ids: any) : Observable<DeleteResponse>;

  /**
   * Abstract method necessary to implement to make sure paginator
   * gets reset when needed.
   */
  protected abstract resetPaginator() : void;

  /**
   * Abstract method necessary to process a new filter value.
   * 
   * @param name Name of filter to use
   * @param value New value for filter
   */
  protected abstract processFilter(name: string, value: string) : void;

  /**
   * Creates a new FormControl for filtering columns, and returns to caller.
   * 
   * @param filterName Name of FormControl's filter
   */
  protected createFormControl(filterName: string) {
    const control = new FormControl('');
    control.valueChanges
      .pipe(debounceTime(this.debounce), distinctUntilChanged())
      .subscribe((query: string) => {
        this.processFilter(filterName, query);
      });
    return control;
  }

  /**
   * Returns data items from backend.
   * 
   * @param countRecords Whether or not we should also retrieve and update count of records
   */
  protected getData(countRecords: boolean = true) {

    this.viewDetails = [];

    // Checking that we actually can retrieve data at all.
    if (!this.canInvoke(this.url(), 'get')) {
      this.data = [];
      this.itemsCount = 0;
      return;
    }

    this.read(this.filter).subscribe((items: any[]) => {
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

        this.count(filterCount).subscribe((count: CountResponse) => {
          this.itemsCount = count.count;
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
  public deleteEntity(entity: any, ids: any) {

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

    this.delete(ids).subscribe((res: DeleteResponse) => {

      if (res.affected !== 1) {
        this.showError(`For some reasons ${res.affected} records was deleted, and not 1 as expected!`);
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

  /**
   * Returns true if the client can invoke the specified endpoint,
   * with the specified verb.
   * 
   * @param url Endpoint's URL
   * @param verb HTTP verb
   */
  public canInvoke(url: string, verb: string) {
    if (this.endpoints.length === 0) {
      return false;
    }
    const endpoints = this.endpoints.filter(x => x.path === url && x.verb === verb);
    if (endpoints.length > 0) {
      const endpoint = endpoints[0];
      return endpoint.auth === null ||
        endpoint.auth.filter(x => this.roles.includes(x)).length > 0;
    }
    return false;
  }
}
