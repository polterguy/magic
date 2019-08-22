
import { Component, OnInit } from '@angular/core';
import { Endpoint } from '../models/endpoint';
import { EndpointService } from '../services/endpoint-service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {
  private displayedColumns: string[] = ['url', 'verb'];
  private endpoints: Endpoint[];
  private selected: Endpoint;
  private arguments: string;
  private isJsonArguments: boolean;

  constructor(private service: EndpointService) { }

  ngOnInit() {
    this.service.getAllEndpoints().subscribe((res) => {
      this.endpoints = [];
      for (const idx of res) {
        const splits = idx.split('.');
        this.endpoints.push({
          url: splits[0],
          verb: splits[1]
        });
      }
    });
  }

  selectEndpoint(el: Endpoint) {
    this.selected = el;
    this.service.getEndpointMeta(el.url, el.verb).subscribe((res) => {
      switch (this.selected.verb) {
        case 'post':
        case 'put':
          this.isJsonArguments = true;
          this.arguments = JSON.stringify(res, null, 2);
          break;
        case 'get':
        case 'delete':
          this.isJsonArguments = false;
          let args = '';
          for (const idx in res) {
            if (Object.prototype.hasOwnProperty.call(res, idx)) {
              if (args.length > 0) {
                args += '&';
              }
              args += idx + '=' + res[idx];
            }
          }
          this.arguments = args;
          break;
        }
    });
  }
}
