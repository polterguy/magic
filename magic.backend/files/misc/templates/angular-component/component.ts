
import { Component, OnInit, Inject } from '@angular/core';
import { HttpService } from '../http-service';

@Component({
  selector: 'app-[[filename]]',
  templateUrl: './[[filename]].component.html',
  styleUrls: ['./[[filename]].component.scss']
})
export class [[component-name]] implements OnInit {
  private data: any;
  private displayedColumns: string[] = [[[columns-list]]];

  constructor(private httpService: HttpService) { }

  ngOnInit() {
    this.httpService.[[service-get-method]]({}).subscribe(res => {
      this.data = res;
    });
  }
}
