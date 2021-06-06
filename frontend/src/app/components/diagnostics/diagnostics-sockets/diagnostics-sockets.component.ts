
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { SocketUser } from '../../endpoints/models/socket-user.model';
import { EndpointService } from '../../endpoints/services/endpoint.service';

/**
 * Sockets diagnostic component, allowing to see current connections and other type of
 * information.
 */
@Component({
  selector: 'app-diagnostics-sockets',
  templateUrl: './diagnostics-sockets.component.html',
  styleUrls: ['./diagnostics-sockets.component.scss']
})
export class DiagnosticsSocketsComponent implements OnInit {

  /**
   * Users as retrieved from backend.
   */
  public users: SocketUser[] = [];

  /**
   * Number of socket connections matching specified filtering condition.
   */
  public count: number;

  /**
   * Filter form control for filtering users to display.
   */
  public filterFormControl: FormControl;

  /**
   * What users are currently being edited and viewed.
   */
   public selectedUsers: string[] = [];

  /**
   * Paginator for paging table.
   */
   @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all connected users from backend
   */
  constructor(
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        this.paginator.pageIndex = 0;
        this.getConnections();
    });

    // Retrieving all connected users from backend.
    this.getConnections();
  }

  /**
   * Invoked when user wants to clear filter.
   */
  public clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles the details view for a single user.
   * 
   * @param user Test to toggle details for
   */
   public toggleDetails(user: SocketUser) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedUsers.indexOf(user.username);
    if (idx !== -1) {

      // Hiding item.
      this.selectedUsers.splice(idx, 1);

    } else {

      // Displaying item.
      this.selectedUsers.push(user.username);
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
   public shouldDisplayDetails(user: SocketUser) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedUsers.filter(x => x === user.username).length > 0;
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
   public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getConnections();
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns connections to caller by unvoking backend.
   */
  private getConnections() {

    // Invoking backend to retrieve connected users.
    this.endpointService.socketUsers(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((users: SocketUser[]) => {

      // Making sure we reset view details items.
      this.selectedUsers = [];

      // Assigning result to model.
      this.users = users ?? [];

      // Retrieving number of socket connections matching filter condition.
      this.endpointService.socketUserCount(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning model.
        this.count = count.count;
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
