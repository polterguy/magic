
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Endpoint } from '../../models/endpoint';
import { EndpointService } from '../../services/endpoint-service';
import { MatInput } from '@angular/material';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {
  @ViewChild('queryParamaters') queryParametersInput: MatInput;
  private displayedColumns: string[] = ['url', 'auth', 'verb', 'crud', 'selected'];
  private displayedSecondRowColumns: string[] = ['details'];
  private endpoints: any[] = [];
  private filter = '';
  private showSystemEndpoints = false;

  constructor(
    private service: EndpointService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.service.getAllEndpoints().subscribe((res) => {
      this.endpoints = (res || []).map(x => {
        return {
          endpoint: x,
          extra: null,
          selected: !x.path.startsWith('magic/modules/system/'),
        };
      });
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  getFilterText() {
    return 'Search among ' + this.getFilteredSystemEndpoints().length + ' endpoints ...';
  }

  getFilteredEndpoints() {
    if (this.filter === '') {
      return this.getFilteredSystemEndpoints();
    }
    return this.getFilteredSystemEndpoints().filter(x => {
      return x.endpoint.verb === this.filter ||
        x.endpoint.path.indexOf(this.filter) > -1 ||
        (x.endpoint.auth !== null &&
          x.endpoint.auth !== undefined &&
          x.endpoint.auth.filter((y: string) => y === this.filter).length > 0);
    });
  }

  getFilteredSystemEndpoints() {
    if (this.showSystemEndpoints === true) {
      return this.endpoints;
    }
    return this.endpoints.filter(x => x.endpoint.path.indexOf('magic/modules/system/') !== 0);
  }

  concatenateAuth(auth: string[]) {
    if (auth === null || auth === undefined) {
      return '';
    }
    return auth.join(',');
  }

  getCrudType(type: string) {
    if (type !== undefined && type !== null && type !== '') {
      return type.substr(5);
    }
    return '';
  }

  getDescription(item: Endpoint) {
    if (item.description !== undefined) {
      return item.description;
    }
    if (item.type) {
      return item.type.substr(5) + ' ' + item.path.substr(item.path.lastIndexOf('/') + 1);
    }
  }

  getClassForDetails(el: any) {
    if (el.extra !== null && el.extra.visible) {
      return 'has-details';
    }
    return 'no-details';
  }

  getClassForRow(row: any) {
    if (row.extra !== null && row.extra.visible) {
      return 'selected';
    }
    return '';
  }

  selectEndpoint(el: any) {

    // Checking if we can just toggle its visibility.
    if (el.extra !== null) {
      if (el.extra.visible) {
        el.extra.visible = false;
        el.extra.endpointResult = null;
      } else {
        el.extra.visible = true;
      }
      return;
    }

    switch (el.endpoint.verb) {
      case 'post':
      case 'put':
        el.extra = {
          isJsonArguments: true,
          arguments: JSON.stringify(el.endpoint.input, null, 2),
          queryParameters: null,
          endpointResult: null,
          visible: true,
        };
        break;

      case 'get':
      case 'delete':
        const args = [];
        for (const idx in el.endpoint.input) {
          if (Object.prototype.hasOwnProperty.call(el.endpoint.input, idx)) {
            args.push({
              name: idx,
              type: el.endpoint.input[idx],
            });
          }
        }
        el.extra = {
          isJsonArguments: false,
          arguments: '',
          queryParameters: args,
          endpointResult: null,
          visible: true,
        };
        break;
      }
  }

  argumentClicked(el: any, name: string) {
    let args = el.extra.arguments;
    if (args.length > 0) {
      if (args.indexOf(name + '=') !== -1) {
        this.showError('You cannot set the same argument twice');
        return;
      }
      args += '&' + name + '=';
    } else {
      args += name + '=';
    }
    el.extra.arguments = args;
  }

  evaluate(el: any) {

    let path = el.endpoint.path;
    if (!el.extra.isJsonArguments && el.extra.arguments !== '') {
      path += '?' + el.extra.arguments;
    }

    switch (el.endpoint.verb) {

      case 'get':
        this.service.executeGet(path).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'delete':
        this.service.executeDelete(path).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'post':
        this.service.executePost(path, JSON.parse(el.extra.arguments)).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'put':
        this.service.executePut(path, JSON.parse(el.extra.arguments)).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;
      }
    return false;
  }

  generateFrontEnd() {
    const toGenerate = this.endpoints.filter(x => x.selected).map(x => x.endpoint);
    const args = {
      files: toGenerate,
      apiUrl: environment.apiURL,
    };
    this.service.generate(args);
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
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
