// Angular imports
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';

// Utility component imports.
import { saveAs } from "file-saver";
import { Buffer } from 'buffer';

// Custom services and models your app depends upon.
import { DeleteResponse } from '../services/models/delete-response';
import { CountResponse } from '../services/models/count-response';
import { AuthService } from 'src/app/services/auth-service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@app/confirm-deletion-dialog/confirm-dialog.component';
import { IREntity } from '@app/services/interfaces/crud-interfaces';

/**
 * Base class for all "data-grid" components, displaying items to
 * perform CRUD operations in a Material table, applying live filtering,
 * sorting, paging, etc.
 */
export abstract class GridComponent {

  // Private cache for foreign key items.
  private cache: any = {};

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
   * @param authService Authentication and authorization service
   * @param snackBar Snack bar to use to display errors, and also general information
   * @param dialog Needed to ask for user's confirmtion during deletion of entities
   * @param sanitizer Needed to be able to dynamically display iframes
   */
  constructor(
    protected authService: AuthService,
    protected snackBar: MatSnackBar,
    protected dialog: MatDialog,
    protected sanitizer: DomSanitizer) {
      const size = localStorage.getItem('page-size');
      if (size) {
        this.filter.limit = +size;
      }
    }

  /**
   * Abstract method you'll need to override to actually return URL of
   * CRUD methods.
   */
  protected abstract entityBaseUrl() : string;

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
  public getData(countRecords: boolean = true) {

    this.viewDetails = [];

    // Checking that we actually can retrieve data at all.
    if (!this.authService.me.canInvoke(this.entityBaseUrl(), 'get')) {
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
   * Ensures URL is returned with https:// prefix
   * 
   * @param value URL to normalise
   */
  public ensureUrl(value: string) {
    if (!value) {
      return null;
    }
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'https://' + value;
    }
    return value;
  }

  /**
   * Invoked when an entity is deleted. Invokes HTTP service that deletes item from backend.
   * 
   * @param entity Entity to delete
   * @param ids Primary keys for entity
   */
  public deleteEntity(ev: Event, entity: any, ids: any) {

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

    // Asking user to confirm deletion of entity.
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        title: 'Confirm action',
        text: 'Please confirm deletion of entity. Notice, this action cannot be undone. Deletion is permanent',
      }
    });

    // Subscribing to close such that we can delete schedule if it's confirmed.
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {

      // Checking if user confirmed that he wants to delete the schedule.
      if (result && result.confirmed) {

        // Deleting entity
        this.delete(ids).subscribe((res: DeleteResponse) => {
            this.getData();
        }, (error: any) => {
          this.showError('I could not delete your entity, maybe other entities are referencing it?');
          console.error(error);
        });
    
      }
    });
    ev.stopPropagation();
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
    this.getData(false);
  }

  /**
   * Downloads the specified content to client by base64 de-encoding it
   * and triggering a download.
   * 
   * @param content Content to base64 de-encode and download to client
   */
  public downloadAsFile(content: string) {
    const filename = content.substring(0, content.indexOf(';'));
    const bytes = content.substring(content.indexOf(',') + 1);
    let type = content.substring(content.indexOf(':') + 1, content.indexOf(','));
    type = type.substring(0, type.indexOf(';'));
    const rawBytes = Buffer.from(bytes, 'base64');
    const file = new Blob([rawBytes], { type: type });
    saveAs(file, filename, false);
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
   * Invoked when pager is paged.
   * 
   * @param e Paging event
   */
  public paged(e: PageEvent) {
    this.viewDetails = [];
    if (this.filter.limit !== e.pageSize) {
      this.filter.limit = e.pageSize;
      this.resetPaginator();
      localStorage.setItem('page-size', e.pageSize.toString());
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
   * Invoked when a referenced item needs to be fetched to display
   * some foreign key lookup value.
   * 
   * @param cacheStorageName Name of cache storage
   * @param id ID to lookup into cache
   * @param param Parameter to add when doing lookup towards server
   * @param entityStorage Storage where to retrieve item from
   * @param property Property to return to caller from objact
   */
  public getCachedItem(
    cacheStorageName: string,
    id: any,
    param: string,
    entityStorage: IREntity,
    property: string) {

    // Making sure this is not a null value.
    if (!id) {
      return '';
    }

    // In case lookup field is the value field, we simply return it immediately as is.
    if (cacheStorageName + '.eq' === param) {
      return id; // No need to invoke server at all.
    }

    // In case display field is the same as the filter field, we simply return it immediately as is.
    if (property +'.eq' === param) {
      return id; // No need to invoke server at all.
    }

    // Making sure we've got cache storage for specified cache type.
    if (!this.cache[cacheStorageName]) {
      this.cache[cacheStorageName] = {};
    }

    // Checking if we already have this item in our cache.
    if (this.cache[cacheStorageName]['id_' + id]) {

      // Item found in cache.
      return this.cache[cacheStorageName]['id_' + id][property];
    }

    // Checking if another invocation previously have started the fetching process to retrieve item from server.
    if (this.cache[cacheStorageName]['id_' + id] === undefined) {

      // Making sure only ONE invocation actually invokes server.
      this.cache[cacheStorageName]['id_' + id] = null;
      entityStorage.read({[param]: id}).subscribe((result: any[]) => {

        // Applying item to cache.
        this.cache[cacheStorageName]['id_' + id] = result[0];
      });
    }

    // Waiting for server method to return - Hence, while we wait, we simply return the ID of the element.
    return id;
  }

  public getUnsafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
      duration: 10000,
    });
  }

  /**
   * Invoked as user tries to filter his result set. Will either
   * create or remove an existing filter, depending upon the value
   * the user typed into the filter textbox.
   */
  protected processFilter(name: string, value: string) {
    this.resetPaginator();
    if (value === '') {
      delete this.filter[name];
    } else {
      this.filter[name] = value;
    }
    this.getData();
  }
}
