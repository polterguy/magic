import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../_services/sql.service';

@Component({
  selector: 'app-catalog-name',
  templateUrl: './catalog-name.component.html',
  styleUrls: ['./catalog-name.component.scss']
})
export class CatalogNameComponent implements OnInit {

  public waitingCreation: boolean = false;

  public name: string = '';

  constructor(
    private sqlService: SqlService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CatalogNameComponent>) { }

  ngOnInit(): void {
  }

  public save() {
    if (this.name === '') {
      this.generalService.showFeedback('Name is required.', 'errorMessage');
    }
    this.waitingCreation = true;
    this.sqlService.createDatabase(
      this.data.dbTypeValue,
      this.data.cStringKey,
      this.name).subscribe({
        next: () => {
          this.generalService.showFeedback('Catalog successfully created.', 'successMessage');
          this.dialogRef.close();
        },
        error: (error: any) => {
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        }
      });
  }
}
