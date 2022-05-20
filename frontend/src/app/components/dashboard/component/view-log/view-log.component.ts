/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LastLogItems } from 'src/app/models/dashboard.model';

@Component({
  selector: 'app-view-log',
  templateUrl: './view-log.component.html',
  styleUrls: ['./view-log.component.scss']
})
export class ViewLogComponent implements OnInit {

  /**
   * 
   * @param data Comes from the parent component once the dialog is being called.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: LastLogItems) { }

  ngOnInit(): void {
    
  }


}
