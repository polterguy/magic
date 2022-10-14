
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, Input, OnInit } from '@angular/core';
import { HttpTransportType, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Endpoint } from '../../../../_protected/pages/generated-endpoints/_models/endpoint.model';
import { Argument } from '../../../../_protected/pages/generated-endpoints/_models/argument.model';
import { Response } from 'src/app/models/response.model';
import { EndpointService } from '../../../../_protected/pages/generated-endpoints/_services/endpoint.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AssumptionService } from 'src/app/components/misc/services/assumption.service';
import { AddQueryParameterDialogComponent } from './add-query-parameter-dialog/add-query-parameter-dialog.component';
import { CreateAssumptionTestDialogComponent, TestModel } from './create-assumption-test-dialog/create-assumption-test-dialog.component';

// CodeMirror options.
import json from '../../../utilities/codemirror/options/json.json';
import markdown from '../../../utilities/codemirror/options/markdown.json';
import hyperlambda from '../../../utilities/codemirror/options/hyperlambda.json';
import json_readonly from '../../../utilities/codemirror/options/json_readonly.json';
import markdown_readonly from '../../../utilities/codemirror/options/markdown_readonly.json';
import hyperlambda_readonly from '../../../utilities/codemirror/options/hyperlambda_readonly.json';

/*
 * Query model encapsulating a single query parameter added to the HTTP invocation.
 */
class QueryModel {
  name: string;
  value: any;
}

/*
 * Result of invocation.
 */
class InvocationResult {
  status: number;
  statusText: string;
  response: string;
  blob: any;
  responseType: string;
}

/*
 * Assumption model for existing tests endpoint has declared.
 */
class Assumption {
  file: string;
  description: string
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
  assumptions: Assumption[] = [];

  /**
   * CodeMirror options object, taken from common settings.
   */
  cmOptions = {
    json: json,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  cmOptionsHyperlambda = {
    json: hyperlambda,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  cmOptionsMarkdown = {
    json: markdown,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  cmOptionsReadonly = {
    json: json_readonly,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  cmHlOptionsReadonly = {
    hl: hyperlambda_readonly,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  markdownOptionsReadonly = {
    md: markdown_readonly,
  };

  /**
   * Payload example for JSON type of endpoints.
   */
  payload: string = null;

  /**
   * Result of invocation.
   */
  result: InvocationResult = null;

  /**
   * URL model for invoking endpoint.
   */
  url: string = null;

  /**
   * Query parameters added to URL.
   */
  query: QueryModel[] = [];

  /**
   * Model for instance.
   */
  @Input() endpoint: Endpoint;

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to be able to create add query value dialog
   * @param clipboard Needed to copy URL of endpoint
   * @param sanitizer Needed to display image results originating from invocations
   * @param backendService Needed to retrieve base root URL for backend
   * @param feedbackService Needed to display feedback to user
   * @param endpointService Needed to be able to invoke endpoint
   * @param assumptionService Needed to be able to retrieve and execute assumptions
   */
  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private sanitizer: DomSanitizer,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService,
    private assumptionService: AssumptionService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.url = '/' + this.endpoint.path;
    if (this.endpoint.verb !== 'get' && this.endpoint.verb !== 'delete') {
      if (this.endpoint.consumes === 'application/json') {
        let payload = {};
        for (var idx of this.endpoint.input ?? []) {
          let type: any = idx.type;
          switch (type) {

            case "long":
            case "ulong":
            case "int":
            case "uint":
            case "short":
            case "ushort":
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

            case "decimal":
            case "float":
            case "double":
              type = 5.5;
              break;
          }
          payload[idx.name] = type;
        }
        setTimeout(() => this.payload = JSON.stringify(payload, null, 2), 250);
        setTimeout(() => {
          document.querySelectorAll('.CodeMirror').forEach(item => {
            var domNode = (<any>item);
            var editor = domNode.CodeMirror;
            editor.doc.markClean();
            editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
          })
        }, 800);

      } else if (this.endpoint.consumes === 'application/x-hyperlambda') {
        setTimeout(() => this.payload = '', 250);
      } else if (this.endpoint.consumes.startsWith('text/')) {
        setTimeout(() => this.payload = '', 250);
      }
    }
    this.getAssumptions();
  }

  /**
   * Returns true if endpoint can be invoked.
   *
   * Notice, we don't support invoking endpoints with for instance application/octet-stream types
   * of input, since we don't have the means to supply the required input to these endpoints.
   */
  canInvoke() {
    return this.endpoint.verb === 'get' ||
      this.endpoint.verb === 'delete' ||
      this.endpoint.consumes === 'application/json' ||
      this.endpoint.consumes === 'application/x-hyperlambda' ||
      this.endpoint.consumes.startsWith('text/');
  }

  /**
   * Returns string representation of authorization requirements for endpoint.
   *
   * @param auth List of roles
   */
  getAuth(auth: string[]) {
    return auth.join(', ');
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  copyUrl() {
    this.clipboard.copy(this.backendService.active.url + this.url);
    this.feedbackService.showInfoShort('URL was copied to your clipboard');
  }

  /**
   * Returns assumption name to caller.
   *
   * @param path Full path of assumption
   */
  getAssumptionName(path: string) {
    const name = path.substring(path.lastIndexOf('/') + 1);
    return name.substring(0, name.length - 3);
  }

  /**
   * Runs the specified assumption, and giving feedback to user if it was successfully assumed or not.
   *
   * @param assumption What assumption to run
   */
  runAssumption(assumption: Assumption) {
    this.assumptionService.execute(assumption.file).subscribe({
      next: (res: Response) => {
        if (res.result === 'success') {
          assumption.success = true;
        } else {
          this.feedbackService.showInfo('Test failed, check log for details');
          assumption.success = false;
        }
      },
      error: (error: any) =>{
        this.feedbackService.showError(error);
        assumption.success = false;
      }});
  }

  /**
   * Returns arguments for endpoint.
   *
   * @param args List of all arguments for endpoint
   * @param controlArguments Whether or not to return control arguments or non-control arguments
   */
  getArguments(args: Argument[], controlArguments: boolean) {
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {
      return args.filter(x => {
        switch (x.name) {
          case 'operator':
          case 'limit':
          case 'offset':
          case 'order':
          case 'direction':
          case 'recaptcha':
            return controlArguments;
          default:
            return !controlArguments;
        }
      });
    } else {
      if (controlArguments) {
        return [];
      }
      return args;
    }
  }

  /**
   * Returns tooltip information for specified argument.
   *
   * @param arg Argument to retrieve tooltip for
   */
  getChipTooltip(arg: Argument) {
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {
      const query = this.query.filter(x => x.name == arg.name);
      if (query.length === 0) {
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
              const comparison = arg.name.substring(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substring(0, arg.name.lastIndexOf('.'));
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
              const comparison = arg.name.substring(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substring(0, arg.name.lastIndexOf('.'));
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
  hasQueryParam(arg: Argument) {
    return this.query.filter(x => x.name === arg.name).length > 0;
  }

  /**
   * Invoked when user wants to add a query parameter to URL.
   *
   * @param arg Argument to add
   */
  addQueryParameter(arg: Argument) {
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
      if (value || value === false || value === 0 || value === '' /* Avoiding explicit conversions to false */) {
        if (arg.type === 'date') {
          value = new Date(value).toISOString();
        }
        if (this.query.filter(x => x.name === arg.name).length > 0) {
          this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
        }
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
  removeQueryParameter(arg: Argument) {
    this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
    this.buildUrl();
  }

  /**
   * Invoked when user wants to invoke endpoint.
   */
  invoke() {
    let responseType = '';
    if (this.endpoint.produces === 'application/json') {
      responseType = 'json';
    } else if (this.endpoint.produces === 'application/x-hyperlambda') {
      responseType = 'hyperlambda';
    } else if (this.endpoint.produces.startsWith('text')) {
      responseType = 'text';
    } else {
      responseType = 'blob';
    }
    try {
      let invocation: Observable<any> = null;
      switch (this.endpoint.verb) {

        case 'get':
          invocation = this.endpointService.get(this.url, responseType);
          break;

        case 'delete':
          invocation = this.endpointService.delete(this.url, responseType);
          break;

        case 'post':
          {
            const payload = this.endpoint.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.post(this.url, payload, responseType);
          }
          break;

        case 'put':
          {
            const payload = this.endpoint.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.put(this.url, payload, responseType);
          }
          break;

        case 'patch':
          {
            const payload = this.endpoint.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.patch(this.url, payload, responseType);
          }
          break;

        case 'socket':
          let builder = new HubConnectionBuilder();
          const hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
              accessTokenFactory: () => this.backendService.active.token.token,
              skipNegotiation: true,
              transport: HttpTransportType.WebSockets,
            }).build();

          hubConnection.start().then(() => {
            let success = true;
            const url = this.url.substring(14);
            hubConnection
              .invoke('execute', url, this.payload)
              .catch(() => {
                this.feedbackService.showError('Something went wrong as we tried to invoke socket endpoint');
                success = false;
              })
              .then(() => {
                hubConnection.stop();
                if (success) {
                  this.feedbackService.showInfoShort('Socket invocation was successful');
                }
              });
          });
          break;
      }

      if (invocation) {
        const startTime = new Date();
        invocation.subscribe({
          next: (res: any) => {
            const endTime = new Date();
            const timeDiff = endTime.getTime() - startTime.getTime();
            const response = responseType === 'json' ? JSON.stringify(res.body || '{}', null, 2) : res.body;
            this.result = {
              status: res.status,
              statusText: res.statusText + ' in ' + new Intl.NumberFormat('en-us').format(timeDiff) + ' milliseconds',
              response: response,
              blob: null,
              responseType,
            };
            if (responseType === 'blob') {
              const objectUrl = URL.createObjectURL(response);
              this.result.blob = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
            }

          },
          error: (error: any) => {
            this.result = {
              status: error.status,
              statusText: error.statusText,
              response: JSON.stringify(error.error || '{}', null, 2),
              blob: null,
              responseType,
            };
          }});
      }
    }
    catch (error) {
      this.feedbackService.showError(error);
    }
  }

  /**
   * Returns whether or not the current invocation was successful or not.
   */
  isSuccess() {
    return this.result && this.result.status >= 200 && this.result.status < 400;
  }

  /**
   * Allows the user to create an assumption/integration test for the current request/response.
   */
  createTest() {
    const dialogRef = this.dialog.open(CreateAssumptionTestDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((res: TestModel) => {
      if (res) {
        this.assumptionService.create(
          res.filename,
          this.endpoint.verb,
          this.url,
          this.result.status,
          res.description !== '' ? res.description : null,
          this.payload !== '' ? this.payload : null,
          (res.matchResponse && !this.result.blob) ? this.result.response : null,
          this.endpoint.produces).subscribe({
            next: () => {
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

            },
            error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates URL with root URL and query parameters.
   */
  private buildUrl() {
    let url = '/' + this.endpoint.path;
    if (this.query.length === 0) {
      this.url = url;
      return;
    }
    url += '?';
    for (let idx of this.query) {
      url += idx.name + '=' + encodeURIComponent(idx.value) + '&';
    }
    this.url = url.substring(0, url.length - 1);
  }

  /*
   * Retrieves assumptions for endpoint
   */
  private getAssumptions() {
    if (this.backendService.active?.access.endpoints.assumptions) {
      this.assumptionService.list('/' + this.endpoint.path, this.endpoint.verb).subscribe({
        next: (assumptions: any) => {
          if (assumptions && assumptions.length) {
              const arr: Assumption[] = [];
                assumptions.forEach((element: any) => {
                  arr.push({
                    file: element.file,
                    description: element.description,
                    success: null
                  });
                });
              this.assumptions = arr;
          }
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }
}
