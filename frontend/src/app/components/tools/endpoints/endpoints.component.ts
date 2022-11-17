
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, HostListener, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Endpoint } from 'src/app/models/endpoint.model';
import { EndpointService } from '../../../_protected/pages/generated-endpoints/_services/endpoint.service';
import { FeedbackService } from 'src/app/services/feedback.service';

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

  // Filter for which items to display.
  private filter: string = '';

  /**
   * To get the width of the screen
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * largeScreen {boolean} :: to check whether the screen width is small or large
   */
  getScreenWidth: number;
  smallScreenSize: number = 768;
  largeScreen: boolean = undefined;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.largeScreen = (this.getScreenWidth > this.smallScreenSize || this.getScreenWidth === this.smallScreenSize) ? true : false;
  }

  /**
   * Will show system endpoints if true.
   */
  displaySystem: boolean = false;

  /**
   * Columns to display in table.
   */
  displayedColumns: string[] = ['verb', 'path', 'auth'];

  /**
   * Model describing endpoints in your installation.
   */
  endpoints: Endpoint[];

  /**
   * Filter form control for filtering log items to display.
   */
  filterFormControl: FormControl;

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
  ngOnInit() {
    this.onWindowResize();

    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filter = query;
      });

    this.getEndpoints();
  }

  /**
   * Returns items matching currently applied filter.
   */
  filteredItems() {
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
  clearFilter() {
    this.filterFormControl.setValue('');
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
    this.getEndpoints(() => this.feedbackService.showInfoShort('Endpoints refreshed'))
  }

  /*
   * Private helper methods.
   */

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  private getEndpoints(onAfter: () => void = null) {
    this.endpointService.endpoints().subscribe({
      next: (endpoints: Endpoint[]) => {
        endpoints.forEach(element =>{
          element.expanded = false;
        });
        this.endpoints = endpoints;
        if (onAfter) {
          onAfter();
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
