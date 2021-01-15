
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin, Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Endpoint } from '../models/endpoint.model';
import { Argument } from '../models/argument.model';
import { Response } from 'src/app/models/response.model';
import { EndpointService } from '../services/endpoint.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AddQueryParameterDialogComponent } from './add-query-parameter-dialog/add-query-parameter-dialog.component';
import { CreateAssumptionTestDialogComponent, TestModel } from './create-assumption-test-dialog/create-assumption-test-dialog.component';

// CodeMirror options.
import json from '../../codemirror/options/json.json';
import json_readonly from '../../codemirror/options/json_readonly.json';

/*
 * Query model encapsulating a single query parameter added to the HTTP invocation.
 */
class QueryModel {

  // Name of query parameter.
  name: string;

  // Value of query parameter.
  value: any;
}

/*
 * Result of invocation.
 */
class InvocationResult {

  // HTTP status code of invocation.
  status: number;

  // HTTP status text of invocation.
  statusText: string;

  // Actual response returned by invocation.
  response: string;

  // If response returned a blob (image?), this will be its value.
  blob: any;
}

/*
 * Assumption model for existing tests endpoint has declared.
 */
class Assumption {

  // Name of assumption (filename)
  name: string;

  // Description of assumption.
  description: string

  // If true, execution was a success.
  success?: boolean;
}

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
   * Assumptions about endpoint.
   */
  public assumptions: Assumption[] = [];

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptionsReadonly = {
    json: json_readonly,
  };

  /**
   * Payload example for JSON type of endpoints.
   */
  public payload: string = null;

  /**
   * Result of invocation.
   */
  public result: InvocationResult = null;

  /**
   * URL model for invoking endpoint.
   */
  public url: string = null;

  /**
   * Query parameters added to URL.
   */
  public query: QueryModel[] = [];

  /**
   * Model for instance.
   */
  @Input() public endpoint: Endpoint;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to be able to create add query value dialog
   * @param clipboard Needed to copy URL of endpoint
   * @param sanitizer Needed to display image results originating from invocations
   * @param backendService Needed to retrieve base root URL for backend
   * @param feedbackService Needed to display feedback to user
   * @param endpointService Needed to be able to invoke endpoint
   */
  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private sanitizer: DomSanitizer,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Model for URL that invokes endpoint.
    this.url = '/' + this.endpoint.path;

    // Checking if this is a JSON payload or not.
    if (this.endpoint.input && this.endpoint.verb !== 'get' && this.endpoint.verb !== 'delete') {

      // JSON payload type.
      let payload = {};
      for (var idx of this.endpoint.input) {
        let type: any = idx.type;
        switch (type) {

          case "long":
            type = 42;
            break;

          case "date":
            type = new Date().toISOString();
            break;

          case "bool":
            type = true;
            break;

          case "string":
            type = "foo";
            break;
        }
        payload[idx.name] = type;
      }
      this.payload = JSON.stringify(payload, null, 2);
    }

    // Retrieving assumptions for endpoint.
    this.getAssumptions();
  }

  /**
   * Returns true if endpoint can be invoked.
   * 
   * Notice, we don't support invoking endpoints with for instance application/octet-stream types
   * of input, since we don't have the means to supply the required input to these endpoints.
   */
  public canInvoke() {
    return this.endpoint.verb === 'get' ||
      this.endpoint.verb === 'delete' ||
      this.endpoint.consumes === 'application/json';
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
    this.clipboard.copy(this.backendService.current.url + this.url);
  }

  /**
   * Returns assumption name to caller.
   * 
   * @param path Full path of assumption
   */
  public getAssumptionName(path: string) {
    const name = path.substr(path.lastIndexOf('/') + 1);
    return name.substr(0, name.length - 3);
  }

  /**
   * Runs the specified assumption, and giving feedback to user if it was successfully assumed or not.
   * 
   * @param assumption What assumption to run
   */
  public runAssumption(assumption: Assumption) {

    // Invoking backend and running assumption.
    this.endpointService.executeTest(assumption.name).subscribe((res: Response) => {
      if (res.result === 'success') {
        assumption.success = true;
      } else {
        this.feedbackService.showInfo('Test failed, check log for details');
        assumption.success = false;
      }
    }, (error: any) =>{
      this.feedbackService.showError(error);
      assumption.success = false;
    });
  }

  /**
   * Returns arguments for endpoint.
   * 
   * @param args List of all arguments for endpoint
   * @param controlArguments Whether or not to return control arguments or non-control arguments
   */
  public getArguments(args: Argument[], controlArguments: boolean) {

    // Checking if this is not a CRUD read/count type of endpoint.
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {

      // Read or count CRUD endpoint
      return args.filter(x => {
        switch (x.name) {
          case 'operator':
          case 'limit':
          case 'offset':
          case 'order':
          case 'direction':
            return controlArguments;
          default:
            return !controlArguments;
        }
      });
    } else {

      // Not a read or count CRUD endpoint.
      if (controlArguments)
        return [];
      return args;
    }
  }

  /**
   * Returns tooltip information for specified argument.
   * 
   * @param arg Argument to retrieve tooltip for
   */
  public getChipTooltip(arg: Argument) {

    // Checking if this is not a CRUD read/count type of endpoint.
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {

      // Read or count CRUD endpoint.
      const query = this.query.filter(x => x.name == arg.name);
      if (query.length === 0) {
  
        // Argument has not been added to query paramaters for invocation.
        switch (arg.name) {

          case 'operator':
            return 'Boolean operator to use for conditions, defaults to \'and\'';

          case 'limit':
            return 'Maximum number of items to return, defaults to 25';

          case 'offset':
            return 'Offset from where to return items';

          case 'order':
            return 'Column to sort by';

          case 'direction':
            return 'Direction to sort by, defaults to \'asc\'';

          default:
            if (arg.name.indexOf('.') !== -1) {
  
              // Highly likely a CRUD conditional argument, such as 'xxx.eq', 'xxx.mteq', etc.
              const comparison = arg.name.substr(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substr(0, arg.name.lastIndexOf('.'));
              switch (comparison) {
  
                case 'eq':
                  return `'${field}' equal to ${arg.type}`;
  
                case 'neq':
                  return `'${field}' not equal to ${arg.type}`;
  
                case 'mteq':
                  return `'${field}' more than or equal to ${arg.type}`;
  
                case 'lteq':
                  return `'${field}' less than or equal to ${arg.type}`;
  
                case 'lt':
                  return `'${field}' less than ${arg.type}`;
  
                case 'mt':
                  return `'${field}' more than ${arg.type}`;
  
                case 'like':
                  return `'${field}' contains ${arg.type}`;
  
                default:
                  return query[0].value;
              }
            } else {
              return arg.type;
            }
        }
      } else {
  
        // Argument has been added to query paramaters for invocation.
        switch (arg.name) {

          case 'operator':
            return query[0].value === 'or' ? 'or conditions together (union)' : 'and conditions together (intersection)';

          case 'limit':
            return `Return maximum ${query[0].value} records`;

          case 'offset':
            return `Return items from record number ${query[0].value}`;

          case 'order':
            return `Sort by '${query[0].value}' column`;

          case 'direction':
            return `Sort ${query[0].value === 'asc' ? 'ascending' : 'descending'}`;

          default:
            if (arg.name.indexOf('.') !== -1) {
  
              // Highly likely a CRUD conditional argument, such as 'xxx.eq', 'xxx.mteq', etc.
              const comparison = arg.name.substr(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substr(0, arg.name.lastIndexOf('.'));
              switch (comparison) {
  
                case 'eq':
                  return `'${field}' equal to ${query[0].value}`;
  
                case 'neq':
                  return `'${field}' not equal to ${query[0].value}`;
  
                case 'mteq':
                  return `'${field}' more than or equal to ${query[0].value}`;
  
                case 'lteq':
                  return `'${field}' less than or equal to ${query[0].value}`;
  
                case 'lt':
                  return `'${field}' less than ${query[0].value}`;
  
                case 'mt':
                  return `'${field}' more than ${query[0].value}`;
  
                case 'like':
                  return `'${field}' contains ${query[0].value}`;
  
                default:
                  return query[0].value;
              }
            }
            return query[0].value;
          }
        }
      } else {

      // Not a read or count CRUD endpoint.
      const query = this.query.filter(x => x.name === arg.name);
      if (query.length > 0) {
        return `${arg.name} equals ${query[0].value}`;
      }
      return arg.type;
    }
  }

  /**
   * Returns true if specified query parameter is already in invocation list.
   * 
   * @param arg Argument to check for
   */
  public hasQueryParam(arg: Argument) {
    return this.query.filter(x => x.name === arg.name).length > 0;
  }

  /**
   * Invoked when user wants to add a query parameter to URL.
   * 
   * @param arg Argument to add
   */
  public addQueryParameter(arg: Argument) {

    // Showing modal dialog allowing user to add a new query parameter to URL.
    const argValue = this.query.filter(x => x.name == arg.name);
    const dialogRef = this.dialog.open(AddQueryParameterDialogComponent, {
      width: '550px',
      data: {
        argument: arg,
        all: this.endpoint.input,
        old: argValue.length > 0 ? argValue[0].value : null,
      }
    });

    dialogRef.afterClosed().subscribe((value: any) => {

      // Checking if modal dialog wants to create a query parameter.
      if (value || value === false || value === 0 || value === '' /* Avoiding explicit conversions to false */) {

        // Checking if type of argument is date, and if so, converting it appropriately.
        if (arg.type === 'date') {
          value = new Date(value).toISOString();
        }

        // Verifying parameter is not already added, and if it is, we remove it first.
        if (this.query.filter(x => x.name === arg.name).length > 0) {
          this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
        }

        // Adding query parameter to list of args, and rebuilding URL.
        this.query.push({
          name: arg.name,
          value: value,
        });
        this.buildUrl();
      }
    });
  }

  /**
   * Invoked when user wants to remove a query parameter from URL.
   * 
   * @param arg Argument to remove
   */
  public removeQueryParameter(arg: Argument) {

    // Removing query parameter from list of args, and rebuilding URL.
    this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
    this.buildUrl();
  }

  /**
   * Invoked when user wants to invoke endpoint.
   */
  public invoke() {

    // Figuring out what endpoint returns.
    let responseType = '';
    if (this.endpoint.produces === 'application/json') {
      responseType = 'json';
    } else if (this.endpoint.produces.startsWith('text')) {
      responseType = 'text';
    } else {
      responseType = 'blob';
    }

    // Creating backend invocation.
    let invocation: Observable<any> = null;
    switch (this.endpoint.verb) {

      case 'get':
        invocation = this.endpointService.get(this.url, responseType);
        break;

      case 'delete':
        invocation = this.endpointService.delete(this.url, responseType);
        break;

      case 'post':
        invocation = this.endpointService.post(this.url, JSON.parse(this.payload), responseType);
        break;

      case 'put':
        invocation = this.endpointService.put(this.url, JSON.parse(this.payload), responseType);
        break;

      case 'patch':
        invocation = this.endpointService.patch(this.url, JSON.parse(this.payload), responseType);
        break;
    }

    // Invoking backend now that we've got our observable.
    invocation.subscribe((res: any) => {

      // Binding result model to result of invocation.
      const response = responseType === 'json' ? JSON.stringify(res.body || '{}', null, 2) : res.body;
      this.result = {
        status: res.status,
        statusText: res.statusText,
        response: response,
        blob: null
      };
      if (response === 'blob') {
        const objectUrl = URL.createObjectURL(response);
        this.result.blob = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }

    }, (error: any) => {

      // Assigning model to result of invocation.
      this.result = {
        status: error.status,
        statusText: error.statusText,
        response: JSON.stringify(error.error || '{}', null, 2),
        blob: null,
      };
    });
  }

  /**
   * Returns whether or not the current invocation was successful or not.
   */
  public isSuccess() {
    return this.result && this.result.status >= 200 && this.result.status < 400;
  }

  /**
   * Allows the user to create an assumption/integration test for the current request/response.
   */
  public createTest() {

    // Showing modal dialog, passing in existing filename if any, defaulting to ''.
    const dialogRef = this.dialog.open(CreateAssumptionTestDialogComponent, {
      width: '550px',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((res: TestModel) => {

      // Checking if user selected a file, at which point filename will be non-null.
      if (res) {

        // User gave us a filename, hence saving file to backend snippet collection.
        this.endpointService.createAssumption(
          res.filename,
          this.endpoint.verb,
          this.url,
          this.result.status,
          res.description !== '' ? res.description : null,
          this.payload !== '' ? this.payload : null,
          (res.matchResponse && !this.result.blob) ? this.result.response : null,
          this.endpoint.produces).subscribe(() => {

          /*
           * Snippet saved, showing user some feedback, and reloading assumptions.
           *
           * Checking if caller wants response to match, and response is blob,
           * at which point we inform user this is not possible.
           */
          if (res.matchResponse && this.result.blob) {
            this.feedbackService.showInfo('Assumption successfully saved. Notice, blob types of invocations cannot assume response equality.');
          } else {
            this.feedbackService.showInfo('Assumption successfully saved');
          }
          this.getAssumptions();

        }, (error: any) => this.feedbackService.showError(error));

      }
    });
  }

  /**
   * Invoked when user wants to close the result view of an invocation.
   */
  public close() {
    this.result = null;
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates URL with root URL and query parameters.
   */
  private buildUrl() {

    // Dynamically building our URL according to query parameters.
    let url = '/' + this.endpoint.path;
    if (this.query.length === 0) {
      this.url = url;
      return;
    }
    url += '?';
    for (let idx of this.query) {
      url += idx.name + '=' + encodeURIComponent(idx.value) + '&';
    }
    this.url = url.substr(0, url.length - 1);
  }

  /*
   * Retrieves assumptions for endpoint
   */
  private getAssumptions() {

    // Retrieving assumptions for endpoint.
    this.endpointService.tests('/' + this.endpoint.path, this.endpoint.verb).subscribe((assumptions: string[]) => {
      if (assumptions && assumptions.length) {
        const all = assumptions.map(x => this.endpointService.getDescription(x));
        forkJoin(all).subscribe((description: Response[]) => {

          // Creating model for assumptions.
          const arr: Assumption[] = [];
          for (let idxNo = 0; idxNo < assumptions.length; idxNo++) {
            arr.push({
              name: assumptions[idxNo],
              description: description[idxNo].result,
              success: null,
            });
          }
          this.assumptions = arr;

        }, (error: any) => this.feedbackService.showError(error));
      }
    }, (error: any) => this.feedbackService.showError(error));
  }
}
