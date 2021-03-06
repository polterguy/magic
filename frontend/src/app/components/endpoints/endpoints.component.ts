
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
   * Columns to display in table.
   */
  public displayedColumns: string[] = ['path', 'verb'];

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
   * @param endpointService Endpoint service required to retrieve meta information about endpoints, and invoke them generically
   */
  constructor(private endpointService: EndpointService) { }

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
    if (this.filter === '') {
      return this.endpoints;
    } else {
      return this.endpoints.filter(x => x.verb === this.filter || x.path.indexOf(this.filter) !== -1);
    }
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

  /*
   * Private helper methods.
   */

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  private getEndpoints() {

    // Invoking backend to retrieve endpoints.
    this.endpointService.endpoints().subscribe((endpoints: Endpoint[]) => {

      // Assigning model to result of invocation.
      this.endpoints = endpoints;
    });
  }
}
