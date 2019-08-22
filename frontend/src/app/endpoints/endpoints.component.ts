
import { Component, OnInit } from '@angular/core';
import { Endpoint } from '../models/endpoint';
import { EndpointService } from '../services/endpoint-service';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {
  private displayedColumns: string[] = ['url', 'verb'];
  private endpoints: Endpoint[];

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
      console.log(this.endpoints);
    });
  }

  getLength() {
    if (this.endpoints) {
      return this.endpoints.length;
    }
    return 0;
  }

  onPaged(event: any) {
  }
}
