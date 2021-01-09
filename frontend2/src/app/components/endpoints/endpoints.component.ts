
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Endpoint } from 'src/app/models/endpoint.model';
import { EndpointService } from './services/endpoint.service';

/**
 * Endpoints component allowing user to see his endpoints, and
 * meta data about his endpoints, in addition to invoking endpoints
 * and see the result of the invocation.
 */
@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html'
})
export class EndpointsComponent implements OnInit {

  /**
   * Model describing endpoints in your installation.
   */
  public endpoints: Endpoint[];

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

    // Retrieving endpoints initially.
    this.getEndpoints();
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
