import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-view-db-list',
  templateUrl: './view-db-list.component.html',
  styleUrls: ['./view-db-list.component.scss']
})
export class ViewDbListComponent implements OnInit {

  displayedColumns: string[] = ['name', 'tables', 'action'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {

  }

}
