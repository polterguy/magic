import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-log-exception',
  templateUrl: './log-exception.component.html',
  styleUrls: ['./log-exception.component.scss']
})
export class LogExceptionComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
