import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-incompatible-file-dialog',
  templateUrl: './incompatible-file-dialog.component.html',
  styleUrls: ['./incompatible-file-dialog.component.scss']
})
export class IncompatibleFileDialogComponent implements OnInit {

   /**
   * Creates an instance of your component.
   * 
   * @param data File object type and name
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    
  }

}
