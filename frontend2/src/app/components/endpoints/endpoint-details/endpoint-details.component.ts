
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Endpoint } from '../models/endpoint.model';
import { Argument } from '../models/argument.model';
import { EndpointService } from '../services/endpoint.service';
import { BackendService } from 'src/app/services/backend.service';

// CodeMirror options.
import json from '../../codemirror/options/json.json'
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Endpoint details component, showing information specific to a single
 * endpoint, and allowing user to invoke endpoint.
 */
@Component({
  selector: 'app-endpoint-details',
  templateUrl: './endpoint-details.component.html',
  styleUrls: ['./endpoint-details.component.scss']
})
export class EndpointDetailsComponent implements OnInit {

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * Payload example for JSON type of endpoints.
   */
  public payload: string = null;

  /**
   * URL model for invoking endpoint.
   */
  public url: string = null;

  /**
   * Model for instance.
   */
  @Input() public endpoint: Endpoint;

  /**
   * Creates an instance of your component.
   * 
   * @param clipboard Needed to copy URL of endpoint
   * @param backendService Needed to retrieve base root URL for backend
   * @param endpointService Needed to be able to invoke endpoint
   */
  constructor(
    private clipboard: Clipboard,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Model for URL that invokes endpoint.
    this.url = this.backendService.current.url + '/' + this.endpoint.path;

    // Checking if this is a JSON payload or not.
    if (this.endpoint.verb !== 'get' && this.endpoint.verb !== 'delete') {

      // JSON payload type.
      let payload = {};
      for (var idx of this.endpoint.input) {
        let type: any = idx.type;
        switch (type) {

          case "long":
            type = 1;
            break;

          case "date":
            type = new Date().toISOString();
            break;

          case "bool":
            type = true;
            break;

          case "string":
            type = "foo bar";
            break;
        }
        payload[idx.name] = type;
      }
      this.payload = JSON.stringify(payload, null, 2);
    }
  }

  /**
   * Returns string representation of authorization requirements for endpoint.
   * 
   * @param auth List of roles
   */
  public getAuth(auth: string[]) {
    return auth.join(', ');
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  public copyUrl() {

    // Copies the currently edited endpoint's URL prepended by backend root URL.
    this.clipboard.copy(this.backendService.current.url + '/' + this.endpoint.path);
  }

  /**
   * Invoked when a query parameter chip item is clicked.
   */
  public selectQueryParameter(arg: Argument) {

    // Appending query parameter to URL.
    if (this.url.indexOf('?') === -1) {

      // First query parameter.
      this.url += '?';
    } else {

      // Consecutive query parameters.
      this.url += '&';
    }

    // Appending actual argument.
    this.url += arg.name + '=';

    // Creating a default value for argument.
    //switch (arg.type)
  }
}
