import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

@Component({
  selector: 'app-link-table',
  templateUrl: './link-table.component.html',
  styleUrls: ['./link-table.component.scss']
})
export class LinkTableComponent implements OnInit {

  public formData: any = {
    table1: '',
    table2: ''
  }

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<LinkTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {

  }

  public secondTableList() {
    if (this.formData.table1 !== '') {
      return this.data.filter((table: any) => { return table.name !== this.formData.table1.name });
    }
    return [];
  }

  public create() {
    if (this.formData.table1 !== '' && this.formData.table2 !== '') {
      console.log(this.formData)
      this.dialogRef.close(this.formData);
    } else {
      this.generalService.showFeedback('Please select both tables.', 'errorMessage');
    }
  }
}
