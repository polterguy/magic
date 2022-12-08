import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss']
})
export class DatabaseComponent implements OnInit {

  public databaseTypes: any;

  constructor() { }

  ngOnInit(): void {

  }

  public passDbTypesToParent(event: string[]) {
    this.databaseTypes = event;
  }
}
