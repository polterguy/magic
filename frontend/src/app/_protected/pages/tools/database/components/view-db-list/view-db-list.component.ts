import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../_services/sql.service';

@Component({
  selector: 'app-view-db-list',
  templateUrl: './view-db-list.component.html',
  styleUrls: ['./view-db-list.component.scss']
})
export class ViewDbListComponent implements OnInit {

  displayedColumns: string[] = ['name', 'tables', 'action'];

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void { }

  public deleteDb(item: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${item.name}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `Database's name`,
          fieldToBeTypedValue: item.name,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.sqlService.dropDatabase(
          this.data.item.dbTypeValue,
          this.data.item.cStringKey,
          item.name).subscribe({
            next: () => {
              this.data.list = this.data.list.filter((el: any) => el.name !== item.name);
              this.generalService.showFeedback('Database successfully deleted.', 'successMessage');
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          });
      }
    })
  }
}
