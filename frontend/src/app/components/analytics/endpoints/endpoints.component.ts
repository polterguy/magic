
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, HostListener, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Endpoint } from 'src/app/models/endpoint.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EndpointService } from '../../../services/analytics/endpoint.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

/**
 * Endpoints component allowing user to see and invoke his endpoints.
 */
@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class EndpointsComponent implements OnInit {

  /**
   * To get the width of the screen 
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * notSmallScreen {boolean} :: to check whether the screen width is small or large
   */
   public getScreenWidth: number;
   public smallScreenSize: number = 768;
   public notSmallScreen: boolean = undefined;
 
   @HostListener('window:resize', ['$event'])
   onWindowResize() {
     this.getScreenWidth = window.innerWidth;
     this.notSmallScreen = (this.getScreenWidth > this.smallScreenSize || this.getScreenWidth === this.smallScreenSize) ? true : false;
   }
 

  public expandedElement;

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

    // Retrieving screen size to show/hide auth column
    this.onWindowResize();

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
      result = result.filter(x => x.type !== 'internal' && !x.path.startsWith('magic/modules/magic/'))
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
      endpoints.forEach(element =>{
        element['expanded'] = false;
      })
      this.endpoints = endpoints;

      // Checking if caller supplied a lambda to execute afterwards.
      if (onAfter) {
        onAfter();
      }

    }, (error: any) => this.feedbackService.showError(error));
  }
}