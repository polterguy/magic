import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.scss']
})
export class WarningComponent implements OnInit {

  /**
   * 
   * @param data to contain location: file || system, currently system is in use, but can be extended to file if needed
   */
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { location: string }) { }

  ngOnInit(): void {
  }

}
