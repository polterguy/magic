
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Endpoint } from 'src/app/models/endpoint.model';
import { EndpointService } from './services/endpoint.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Endpoints component allowing user to see and invoke his endpoints.
 */
@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {

  // List of log item IDs that we're currently viewing details for.
  private displayDetails: string[] = [];

  // Filter for which items to display.
  private filter: string = '';

  /**
   * Will show system endpoints if true.
   */
  public displaySystem: boolean = false;

  /**
   * Columns to display in table.
   */
  public displayedColumns: string[] = ['verb', 'path', 'auth'];

  /**
   * Model describing endpoints in your installation.
   */
  public endpoints: Endpoint[];

  /**
   * Filter form control for filtering log items to display.
   */
  public filterFormControl: FormControl;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display feedback to user
   * @param endpointService Endpoint service required to retrieve meta information about endpoints, and invoke them generically
   */
  constructor(
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.displayDetails = [];
        this.filter = query;
      });

    // Retrieving endpoints initially.
    this.getEndpoints();
  }

  /**
   * Returns items matching currently applied filter.
   */
  public filteredItems() {
    let result = this.endpoints;
    if (this.displaySystem === false) {
      result = result.filter(x => !x.path.startsWith('magic/modules/system/') && !x.path.startsWith('magic/modules/magic/'))
    }
    if (this.filter !== '') {
      result = result.filter(x => x.verb === this.filter || x.path.indexOf(this.filter) !== -1);
    }
    return result;
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Resetting filter form control's value.
    this.displayDetails = [];
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles details about one specific endpoint item.
   * 
   * @param el Log item to toggle details for
   */
  public toggleDetails(el: Endpoint) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(el.verb + el.path);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(el.verb + el.path);
    }
  }

  /**
   * Returns true if details for specified endpoint item should be displayed.
   * 
   * @param el Endpoint item to display details for
   */
  public shouldDisplayDetails(el: Endpoint) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === el.verb + el.path).length > 0;
  }

  /**
   * Returns a string containing all roles allowed to invoke endpoint.
   * 
   * @param item Endpoint to return auth for
   */
  public getAuth(item: Endpoint) {
    if (!item.auth) {
      return '';
    }
    return item.auth.join(', ');
  }

  /**
   * Invoked when user needs to refresh his endpoints.
   */
  public refresh() {

    // Invoking method responsible for re-retrieving endpoints again.
    this.getEndpoints(() => this.feedbackService.showInfoShort('Endpoints refreshed'))
  }

  /*
   * Private helper methods.
   */

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  private getEndpoints(onAfter: () => void = null) {

    // Invoking backend to retrieve endpoints.
    this.endpointService.endpoints().subscribe((endpoints: Endpoint[]) => {

      // Assigning model to result of invocation.
      this.endpoints = endpoints;

      // Checking if caller supplied a lambda to execute afterwards.
      if (onAfter) {
        onAfter();
      }

    }, (error: any) => this.feedbackService.showError(error));
  }
}
