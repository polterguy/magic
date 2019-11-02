
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Endpoint } from '../../models/endpoint';
import { EndpointService } from '../../services/endpoint-service';
import { MatInput } from '@angular/material';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {
  @ViewChild('queryParamaters') queryParametersInput: MatInput;
  private displayedColumns: string[] = ['url', 'auth', 'verb'];
  private selectedRowUrl = '';
  private endpoints: Endpoint[] = [];
  private filter = '';
  private selected: Endpoint;
  private arguments: string;
  private isJsonArguments: boolean;
  private endpointResult: string;
  private currentUrl: string;
  private showSystemEndpoints = false;
  private queryParameters = [];

  constructor(
    private service: EndpointService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.service.getAllEndpoints().subscribe((res) => {
      this.endpoints = res || [];
    }, (err) => {
      this.showHttpError(err);
    });
  }

  getFilterText() {
    return 'Search among ' + this.getFilteredSystemEndpoints().length + ' endpoints ...';
  }

  highlight(row: string) {
    this.selectedRowUrl = row;
  }

  getFilteredEndpoints() {
    if (this.filter === '') {
      return this.getFilteredSystemEndpoints();
    }
    return this.getFilteredSystemEndpoints().filter(x => {
      return x.verb === this.filter || x.path.indexOf(this.filter) > -1 || x.auth.filter(y => y === this.filter).length > 0;
    });
  }

  getFilteredSystemEndpoints() {
    if (this.showSystemEndpoints === true) {
      return this.endpoints;
    }
    return this.endpoints.filter((x) => {
      return x.path.indexOf('magic/modules/system/') !== 0 &&
        x.path.indexOf('magic/modules/mysql/') !== 0 &&
        x.path.indexOf('magic/modules/mssql/') !== 0;
    });
  }

  concatenateAuth(auth: string[]) {
    if (auth === null || auth === undefined) {
      return '';
    }
    return auth.join(',');
  }

  selectEndpoint(el: Endpoint) {
    this.endpointResult = null;
    this.selected = el;

    this.service.getEndpointMeta(el.path, el.verb).subscribe((res) => {

      switch (this.selected.verb) {
        case 'post':
        case 'put':
          this.isJsonArguments = true;
          this.arguments = JSON.stringify(res, null, 2);
          this.queryParameters = null;
          break;

        case 'get':
        case 'delete':
          this.isJsonArguments = false;
          this.arguments = '';
          let args = [];
          for (const idx in res) {
            if (Object.prototype.hasOwnProperty.call(res, idx)) {
              args.push({
                name: idx,
                type: res[idx],
              });
            }
          }
          this.queryParameters = args;
          break;
        }
    }, (err) => {
      this.showHttpError(err);
    });
  }

  argumentClicked(name: string) {
    let args = this.arguments;
    if (args.length > 0) {
      args += '&' + name + '=';
    } else {
      args += name + '=';
    }
    this.arguments = args;
    this.queryParametersInput.focus();
  }

  evaluate() {

    this.currentUrl = this.selected.path;
    if (!this.isJsonArguments && this.arguments !== '') {
      this.currentUrl += '?' + this.arguments;
    }

    switch (this.selected.verb) {

      case 'get':
        this.service.executeGet(this.currentUrl).subscribe((res) => {
          this.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showHttpError(error);
        });
        break;

      case 'delete':
        this.service.executeDelete(this.currentUrl).subscribe((res) => {
          this.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showHttpError(error);
        });
        break;

      case 'post':
        this.service.executePost(this.currentUrl, JSON.parse(this.arguments)).subscribe((res) => {
          this.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showHttpError(error);
        });
        break;

      case 'put':
        this.service.executePut(this.currentUrl, JSON.parse(this.arguments)).subscribe((res) => {
          this.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showHttpError(error);
        });
        break;
      }
    return false;
  }

  showHttpError(error: any) {
    console.error(error);
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, null, {
      duration: 2000,
    });
  }
}
