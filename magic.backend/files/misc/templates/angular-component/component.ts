/*
 * Magic, Copyright(c) Thomas Hansen 2019, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { HttpService } from 'src/app/services/http-service';
import { [[component-edit-modal-name]] } from './modals/[[filename]]-edit-modal';

/*
 * "Datagrid" component for displaying instance of [[filename]]
 * entities from your HTTP REST backend.
 */
@Component({
  selector: 'app-[[filename]]',
  templateUrl: './[[filename]].component.html',
  styleUrls: ['./[[filename]].component.scss']
})
export class [[component-name]] implements OnInit {

  // Actual data currently displayed in the grid. The mat-table will be databound to this list.
  private data: any[];

  // Which columns we should display. Reorder to prioritize columns differently.
  private displayedColumns: string[] = [[[columns-list]]];

  // Current filter being applied to filter items from our backend.
  private filter: any = {
    limit: 10
  };

  // Number of items our backend reports are available in total, matching our above filter condition.
  private count: number = 0;
  private hasFiltered = false;

  // Number of milliseconds after a keystroke before filtering should be re-applied.
  private debounce: number = 400;

  // List of items we're currently viewing details for.
  private viewDetails: any[] = [];

  // Need to view paginator as a child to update page index of it.
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  // Form control declarations to bind up with reactive form elements.
[[form-control-declarations]]

  // Constructor taking a bunch of services/helpers through dependency injection.
  constructor(
    private httpService: HttpService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  // OnInit implementation. Retrieves initial data (unfiltered) and instantiates our FormControls.
  ngOnInit() {

    // Retrieves data from our backend, unfiltered, and binds our mat-table accordingly.
    this.getData();

    // Necessary to make sure we can have "live filtering" in our datagrid.
[[form-control-value-subscriptions]]  }

  /*
   * Returns the class for the header row, which will only be visible
   * if there are more than 20 records in dataset, before filtering has been applied.
   */
  getHeaderRowClass() {
    if (this.hasFiltered || this.count > 10) {
      return 'visible';
    }
    return 'hidden';
  }

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
        let cloned = {};
        for(const idx in this.filter) {
          if (Object.prototype.hasOwnProperty.call(this.filter, idx)) {
            switch(idx) {
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
        }, error => {

          // Oops, error when invoking count method.
          console.error(error);
          this.error(error.error.message);
        });
      }
    }, error => {

      // Oops, error when invoking get items method.
      console.error(error);
      this.error(error.error.message);
    });
  }

  // Shows or hides the "view details" row for a specific record.
  toggleDetails(entity: any) {
    const indexOf = this.viewDetails.indexOf(entity);
    if (indexOf === -1) {
      this.viewDetails.push(entity);
    } else {
      this.viewDetails.splice(indexOf, 1);
    }
  }

  // Returns true if details should be displayed for a specific database record.
  shouldDisplayDetails(entity: any) {
    if (this.viewDetails.indexOf(entity) != -1) {
      return true;
    }
    return false;
  }

  /*
   * Returns CSS class name for a specific table row (tr element).
   * Notice, the CSS class is changed according to whether or not the details
   * window is visible or not.
   */
  getClassForRecord(entity: any) {
    if (this.viewDetails.indexOf(entity) != -1) {
      return 'grid-row visible-details';
    }
    return 'grid-row';
  }

  /*
   * Returns the CSS class for the "view details" parts.
   * Notice, this basically ensures that the "view details" is invisible unless
   * explicitly shown by the user choosing to view the details for a record.
   */
  getClassForDetails(entity: any) {
    if (this.viewDetails.indexOf(entity) != -1) {
      return 'details-row visible';
    }
    return 'details-row hidden';
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
    let data = {
      isEdit: true,
      entity: {},
    };
    for (var idx in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, idx)) {
        data.entity[idx] = entity[idx];
      }
    }

    // Creating our modal dialog, passing in the cloned entity, and "isEdit" as true.
    const dialogRef = this.dialog.open([[component-edit-modal-name]], {
      data
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {

        // User clicked "Save" button, making sure we update databound grid item according to the new value(s).
        for (var idx in res) {
          if (Object.prototype.hasOwnProperty.call(res, idx)) {
            entity[idx] = res[idx];
          }
        }

        // Showing a little information window, giving the user feedback about that editing was successful.
        this.snackBar.open('[[filename]] successfully updated', 'Close', {
          duration: 2000,
        });
      }
    });
  }

  // Creates a new data record, by showing the modal edit/create dialog.
  createNewRecord() {

    // Parametrizing our modal dialog correctly. Notice "idEdit" being false.
    let data = {
      isEdit: false,
      entity: {},
    };

    // Opening our dialog.
    const dialogRef = this.dialog.open([[component-edit-modal-name]], {
      data
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {

        // Notice, at this point, the item is already saved. Hence, re-retrieving data from backend.
        this.getData();
        this.snackBar.open('[[filename]] item successfully created', 'Close', {
          duration: 2000,
        });
      }
    });
  }

  // Invoked when an entity is deleted. Invokes HTTP service that deletes item from backend.
  delete(entity: any, ids: any) {

    // Invoking HTTP service DELETE method.
    this.httpService.[[service-delete-method]](ids).subscribe(res => {

      // Making sure we remove "view details" for item, if item is currently being viewed.
      const indexOf = this.viewDetails.indexOf(entity);
      if (indexOf !== -1) {
        this.viewDetails.splice(indexOf, 1);
      }

      // Re-retrieving data from backend, according to filter (we're down one record now according to our pager).
      this.getData();
    }, error => {

      // Oops, error when attempting to delete item.
      console.error(error);
      this.error(error.error.message);
    });
  }

  // Invoked when pager is paged.
  paged(e: PageEvent) {
    this.getData(false);
  }

  // Helper method to display an error to user in a friendly SnackBar type of widget.
  error(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
