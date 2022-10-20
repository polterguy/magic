import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrls: ['./unsaved-changes-dialog.component.scss']
})
export class UnsavedChangesDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit(): void {
  }

}
