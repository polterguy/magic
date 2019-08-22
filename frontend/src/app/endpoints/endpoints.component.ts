
import { Component, OnInit } from '@angular/core';
import { Endpoint } from '../models/endpoint';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {
  displayedColumns: string[] = ['url', 'verb'];
  private endpoints: Endpoint[];

  constructor() { }

  ngOnInit() {
  }
}
