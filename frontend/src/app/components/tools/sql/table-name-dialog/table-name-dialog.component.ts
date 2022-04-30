import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-name-dialog',
  templateUrl: './table-name-dialog.component.html',
  styleUrls: ['./table-name-dialog.component.scss']
})
export class TableNameDialogComponent implements OnInit {

  public table_name: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
