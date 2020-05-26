
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from '@angular/material';
import { CrudifyService } from 'src/app/services/crudify-service';

export interface DialogData {
  field: string;
  hyperlambda: string;
}

@Component({
  templateUrl: 'legend-dialog.html',
})
export class LegendDialogComponent {
}
