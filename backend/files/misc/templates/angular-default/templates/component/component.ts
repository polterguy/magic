import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { GridComponent } from '../../base/grid.component';

import { HttpService } from 'src/app/services/http-service';
import { AuthService } from 'src/app/services/auth-service';
import { MessageService } from 'src/app/services/message-service';
import { Edit[[component-name]] } from './modals/edit.[[component-filename]]';

/**
 * "Datagrid" component for displaying instance of [[component-header]]
 * entities from your HTTP REST backend.
 */
@Component({
  selector: '[[component-selector]]',
  templateUrl: './[[component-filename]].html',
  styleUrls: ['./[[component-filename]].scss']
})
export class [[component-name]] extends GridComponent implements OnInit {

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
    protected messages: MessageService,
    protected jwtHelper: JwtHelperService,
    protected authService: AuthService,
    private httpService: HttpService,
    public dialog: MatDialog) {
      super(authService, messages, snackBar, jwtHelper);
  }

  /**
   * Overridde abstract method necessary to return the URL endpoint
   * for CRUD methods to base class.
   */
  protected getUrl() {
    return '[[endpoint-url]]';
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually retrieve items from backend.
   */
  protected getItems(filter: any) {
    return this.httpService.[[service-get-method]](filter);
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually retrieve count of items from backend.
   */
  protected getCount(filter: any) {
    return this.httpService.[[service-count-method]](filter);
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually delete items in backend.
   */
  protected getDelete(ids: any) {
    return this.httpService.[[service-delete-method]](ids);
  }

  /**
   * Implementation of abstract base class method, to reset paginator
   * of component.
   */
  protected resetPaginator() {
    this.paginator.pageIndex = 0;
  }

  /**
   * OnInit implementation. Retrieves initial data (unfiltered),
   * and instantiates our FormControls.
   */
  public ngOnInit() {

    // Calls base initialization method.
    this.initCommon();

    // Retrieves data from our backend, unfiltered, and binds our mat-table accordingly.
    this.getData();

    // Necessary to make sure we can have "live filtering" in our datagrid.
[[form-control-instantiations]]  }

  /**
   * Invoked when user wants to edit an entity
   * This will show a modal dialog, allowing the user to edit his record.
   */
  public editDetails(entity: any) {

    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data: this.getEditData(entity)
    });
    dialogRef.afterClosed().subscribe(editResult => {
      this.setEditData(editResult, entity);
    });
  }

  /**
   * Creates a new data record, by showing the modal edit/create dialog.
   */
  public createNewRecord() {

    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data: {
        isEdit: false,
        entity: {},
      }});
    dialogRef.afterClosed().subscribe((createResult: any) => {
      this.itemCreated(createResult);
    });
  }
}
