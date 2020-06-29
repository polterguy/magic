import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BaseComponent } from '../../base.component';

import { HttpService } from 'src/app/services/http-service';
import { Edit[[component-name]] } from './modals/edit.[[component-filename]]';

/*
 * "Datagrid" component for displaying instance of [[component-header]]
 * entities from your HTTP REST backend.
 */
@Component({
  selector: '[[component-selector]]',
  templateUrl: './[[component-filename]].html',
  styleUrls: ['./[[component-filename]].scss']
})
export class [[component-name]] extends BaseComponent implements OnInit {

  /**
   * Which columns we should display. Reorder to prioritize columns differently.
   * Notice! 'delete-instance' should always come last.
   */
  public displayedColumns: string[] = [[[displayed-columns]]];

  // Need to view paginator as a child to update page index of it.
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  // Form control declarations to bind up with reactive form elements.
[[form-control-declarations]]

  // Constructor taking a bunch of services/helpers through dependency injection.
  constructor(
    protected snackBar: MatSnackBar,
    protected jwtHelper: JwtHelperService,
    private httpService: HttpService,
    public dialog: MatDialog) {
      super(snackBar, jwtHelper);
    }

  // OnInit implementation. Retrieves initial data (unfiltered) and instantiates our FormControls.
  ngOnInit() {

    // Retrieves data from our backend, unfiltered, and binds our mat-table accordingly.
    this.getData();

    // Necessary to make sure we can have "live filtering" in our datagrid.
[[form-control-instantiations]]  }

  // Method that retrieves data from backend according to specified filter.
  getData(countRecords: boolean = true) {

    // Resetting view details, to avoid "hanging objects". Notice, will close all "view details" items in grid.
    this.viewDetails = [];

    // Retrieves items from our backend through our HTTP service layer.
    this.httpService.[[service-get-method]](this.filter).subscribe(res => {
      this.data = res;

      // Checking if user wants to (re)-count items, and if so, invoking "count records" HTTP service method.
      if (countRecords) {

        // Notice, we need to clone all filter arguments, except limit, offset, order and direction.
        const cloned = {};
        for (const idx in this.filter) {
          if (Object.prototype.hasOwnProperty.call(this.filter, idx)) {
            switch (idx) {
              case 'limit':
              case 'offset':
              case 'order':
              case 'direction':
                break; // Ignoring
              default:
                cloned[idx] = this.filter[idx];
                break;
            }
          }
        }

        // Invoking "count records" HTTP service layer method.
        this.httpService.[[service-count-method]](cloned).subscribe(res2 => {
          this.count = res2.count;
        }, error => this.showError(error));
      }
    }, error => this.showError(error));
  }

  // Sorts by the specified column.
  sort(column: string) {
    if (this.filter.order === column) {

      // Inverting sort direction.
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
    this.paginator.pageIndex = 0;
    this.filter.offset = 0;
    this.getData(false);
  }

  /*
   * Invoked when user wants to edit an entity
   * This will show a modal dialog, allowing the user to edit his record.
   */
  editDetails(entity: any) {

    /*
     * Cloning our entity, in case user doesn't click the "Save" button,
     * to avoid changing main databound entity.
     */
    const data = {
      isEdit: true,
      entity: {},
    };
    for (const idx in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, idx)) {
        data.entity[idx] = entity[idx];
      }
    }

    // Creating our modal dialog, passing in the cloned entity, and "isEdit" as true.
    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {

        // User clicked "Save" button, making sure we update databound grid item according to the new value(s).
        for (const idx in res) {
          if (Object.prototype.hasOwnProperty.call(res, idx)) {
            entity[idx] = res[idx];
          }
        }

        // Showing a little information window, giving the user feedback about that editing was successful.
        this.snackBar.open('[[component-header]] item successfully updated', 'Close', {
          duration: 2000,
        });
      }
    });
  }

  // Creates a new data record, by showing the modal edit/create dialog.
  createNewRecord() {

    // Parametrizing our modal dialog correctly. Notice "idEdit" being false.
    const data = {
      isEdit: false,
      entity: {},
    };

    // Opening our dialog.
    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {

        // Notice, at this point, the item is already saved. Hence, re-retrieving data from backend.
        this.getData();
        this.snackBar.open('[[component-header]] item successfully created', 'Close', {
          duration: 2000,
        });
      }
    });
  }

  // Invoked when an entity is deleted. Invokes HTTP service that deletes item from backend.
  delete(entity: any, ids: any) {

    // Making sure we actually have a primary key, and if not, preventing deletion.
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

    // Invoking HTTP service DELETE method.
    this.httpService.[[service-delete-method]](ids).subscribe(res => {

      // Sanity checking invocation.
      if (res['deleted-records'] !== 1) {
        this.showError(`For some reasons ${res['deleted-records']} records was deleted, and not 1 as expected!`);
      }

      // Making sure we remove "view details" for item, if item is currently being viewed.
      const indexOf = this.viewDetails.indexOf(entity);
      if (indexOf !== -1) {
        this.viewDetails.splice(indexOf, 1);
      }

      // Re-retrieving data from backend, according to filter (we're down one record now according to our pager).
      this.getData();
    }, error => this.showError(error));
  }

  // Invoked when pager is paged.
  paged(e: PageEvent) {
    this.viewDetails = [];
    if (this.filter.limit !== e.pageSize) {
      this.filter.limit = e.pageSize;
      this.paginator.pageIndex = 0;
      this.filter.offset = 0;
    } else {
      this.filter.offset = e.pageIndex * e.pageSize;
    }
    this.getData(false);
  }
}
