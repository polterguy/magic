
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpTransportType, HubConnectionBuilder } from '@aspnet/signalr';
import { DomSanitizer } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Argument } from '../../../_protected/pages/manage/endpoints/_models/argument.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { EndpointService } from '../../services/endpoint.service';
import { InvocationResult } from '../../../_protected/pages/manage/endpoints/endpoints-result/endpoints-result.component';

// CodeMirror options.
import json from '../../../codemirror/options/json.json';
import markdown from '../../../codemirror/options/markdown.json';
import hyperlambda from '../../../codemirror/options/hyperlambda.json';
import json_readonly from '../../../codemirror/options/json_readonly.json';
import markdown_readonly from '../../../codemirror/options/markdown_readonly.json';
import hyperlambda_readonly from '../../../codemirror/options/hyperlambda_readonly.json';
import { CreateAssumptionTestDialogComponent, TestModel } from '../create-assumption-test-dialog/create-assumption-test-dialog.component';
import { AssumptionService } from 'src/app/_general/services/assumption.service';
import { AssumptionsComponent } from '../assumptions/assumptions.component';

/**
 * Dialog for executing endpoints from Hyper IDE.
 */
@Component({
  selector: 'app-execute-endpoint-dialog',
  templateUrl: './execute-endpoint-dialog.component.html',
  styleUrls: ['./execute-endpoint-dialog.component.scss']
})
export class ExecuteEndpointDialogComponent implements OnInit {

  private originalPath: string = '';

  itemDetails: any = {};
  parameters: any = [];

  @ViewChild('assumptions', { static: false }) assumptions: AssumptionsComponent;

  cm = {
    json,
    json_readonly,
    hyperlambda,
    hyperlambda_readonly,
    markdown,
    markdown_readonly,
  };

  payload: string = null;
  result: InvocationResult = null;
  isExecuting: boolean = false;
  paramsForm = this.formBuilder.group({});
  codemirrorIsReady: boolean = false;
  canCreateAssumption: boolean = false;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    public backendService: BackendService,
    private generalService: GeneralService,
    private endpointService: EndpointService,
    private assumptionService: AssumptionService,
    @Inject(MAT_DIALOG_DATA) public data: { itemToBeTried: any }) { }

  ngOnInit() {

    this.itemDetails = [];
    this.parameters = [];
    this.result = null;
    this.paramsForm = this.formBuilder.group({});
    this.prepareData(this.data.itemToBeTried);
  }

  getArguments(args: Argument[], controlArguments: boolean) {

    if (this.itemDetails.type === 'crud-read' || this.itemDetails.type === 'crud-count') {
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

  getDescription(arg: any) {

    if (this.itemDetails.type === 'crud-read' || this.itemDetails.type === 'crud-count') {

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
                return '';
            }
          } else {
            return arg.type;
          }
      }
    } else {
      return `${arg.name} equals to`
    }
  }

  canInvoke() {

    return this.itemDetails?.verb === 'get' ||
      this.itemDetails?.verb === 'delete' ||
      this.itemDetails?.consumes === 'application/json' ||
      this.itemDetails?.consumes === 'application/x-hyperlambda' ||
      this.itemDetails?.consumes?.startsWith(<String>'text/');
  }

  invoke() {

    this.itemDetails.path = this.originalPath;
    if (Object.values(this.paramsForm.value).length) {
      let url: string = `${this.itemDetails.path}`;
      url += '?';

      for (const key in this.paramsForm.value) {
        if (this.paramsForm.value[key]) {
          const type: string = this.itemDetails.input.find((element: any) => element.name === key).type;
          if (type === 'date') {
            url += key + '=' + encodeURIComponent(new Date(this.paramsForm.value[key]).toISOString()) + '&';
          } else {
            url += key + '=' + encodeURIComponent(this.paramsForm.value[key]) + '&';
          }
        }
      }
      this.itemDetails.path = url.substring(0, url.length - 1);
    }

    this.isExecuting = true;
    let responseType = '';
    if (this.itemDetails.produces === 'application/json') {
      responseType = 'json';
    } else if (this.itemDetails.produces === 'application/x-hyperlambda') {
      responseType = 'hyperlambda';
    } else if (this.itemDetails.produces.startsWith('text')) {
      responseType = 'text';
    } else {
      responseType = 'blob';
    }
    try {
      let invocation: Observable<any> = null;

      switch (this.itemDetails.verb) {

        case 'get':
          invocation = this.endpointService.get(`/${this.itemDetails.path}`, responseType);
          break;

        case 'delete':
          invocation = this.endpointService.delete(`/${this.itemDetails.path}`, responseType);
          break;

        case 'post':
          {
            const payload = this.itemDetails.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.post(`/${this.itemDetails.path}`, payload, responseType);
          }
          break;

        case 'put':
          {
            const payload = this.itemDetails.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.put(`/${this.itemDetails.path}`, payload, responseType);
          }
          break;

        case 'patch':
          {
            const payload = this.itemDetails.consumes === 'application/json' ? JSON.parse(this.payload) : this.payload;
            invocation = this.endpointService.patch(`/${this.itemDetails.path}`, payload, responseType);
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
            const url = `/${this.itemDetails.path}`.substring(14);
            hubConnection
              .invoke('execute', url, this.payload)
              .catch(() => {
                this.generalService.showFeedback('Something went wrong as we tried to invoke socket endpoint');
                success = false;
                this.isExecuting = false;
              })
              .then(() => {
                hubConnection.stop();
                if (success) {
                  this.isExecuting = false;
                  this.generalService.showFeedback('Socket invocation was successful');
                }
              });
          });
          break;
      }

      if (invocation) {
        const startTime = new Date();

        this.generalService.showLoading();
        invocation.subscribe({
          next: (res: any) => {

            this.generalService.hideLoading();
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
            this.isExecuting = false;
            this.canCreateAssumption = true;
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.isExecuting = false;
            this.result = {
              status: error.status,
              statusText: error.statusText,
              response: JSON.stringify(error.error || '{}', null, 2),
              blob: null,
              responseType,
            };
            this.canCreateAssumption = true;
          }
        });
      }
    }
    catch (error) {

      this.isExecuting = false;
      this.canCreateAssumption = true;
      this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
    }
  }

  isSuccess() {

    return this.result && this.result.status >= 200 && this.result.status < 400;
  }

  inputTypes(item: string) {

    switch (item) {

      case 'bool':
        return 'text';

      case 'string':
        return 'text';

      case 'long':
      case 'int':
      case 'uint':
      case 'short':
      case 'ushort':
        return 'number';

      case 'date':
        return 'date';
    }
  }

  createTest() {

    const dialogRef = this.dialog.open(CreateAssumptionTestDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((res: TestModel) => {
      if (res) {

        this.generalService.showLoading();
        this.assumptionService.create(
          res.filename,
          this.itemDetails.verb,
          `/${this.itemDetails.path}`,
          this.result?.status,
          res.description !== '' ? res.description : null,
          this.payload !== '' ? this.payload : null,
          (res.matchResponse && !this.result?.blob) ? this.result?.response : null,
          this.itemDetails.produces).subscribe({
            next: () => {

              this.generalService.hideLoading();
              if (res.matchResponse && this.result.blob) {
                this.generalService.showFeedback('Assumption successfully saved. Notice, blob types of invocations cannot assume response equality.', 'successMessage', 'Ok', 5000);
              } else {
                this.generalService.showFeedback('Assumption successfully saved', 'successMessage');
              }

              this.assumptions.getAssumptions();
              this.cdr.detectChanges();
            },
            error: (error: any) => {

              this.generalService.hideLoading();
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            }
          });
      }
    });
  }

  copyResult(response: any) {

    this.clipboard.copy(response);
    this.generalService.showFeedback('Result can be found on your clipboard');
  }

  /*
   * Private helper methods.
   */

  private prepareData(item: any) {

    this.itemDetails = item;

    this.originalPath = item.path;

    item.input ? this.setForm() : '';
    this.getParams();

    if (this.itemDetails.consumes === 'application/json') {
      let payload = {};
      for (var idx of this.itemDetails.input ?? []) {
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
      this.payload = JSON.stringify(payload, null, 2);
      setTimeout(() => {
        document.querySelectorAll('.CodeMirror').forEach(item => {
          var domNode = (<any>item);
          var editor = domNode.CodeMirror;
          editor.doc.markClean();
          editor.doc.clearHistory();
        })
      }, 800);

    } else if (this.itemDetails.consumes === 'application/x-hyperlambda') {
      setTimeout(() => this.payload = '', 250);
    } else if (this.itemDetails?.consumes?.startsWith('text/')) {
      setTimeout(() => this.payload = '', 250);
    }
    setTimeout(() => {
      this.codemirrorIsReady = true;
    }, 500);
    this.cdr.detectChanges();
  }

  private getParams() {

    this.parameters = (this.itemDetails.input as any)?.map((item: any) => { return item.name }) || [];
  }

  private setForm() {

    this.itemDetails.input.forEach((element: any) => {
      this.paramsForm.setControl(element.name, new FormControl<any>(''));
    });
  }
}
