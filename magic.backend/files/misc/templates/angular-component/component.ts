
import { Component, OnInit, Inject } from '@angular/core';
import { HttpService } from '../http-service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class [[component-name]] implements OnInit {
  private dataSource: any;
  private entityName: string = '[[entity-name]]';
  private displayedColumns: string[] = [[[columns-list]]];

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }
}
