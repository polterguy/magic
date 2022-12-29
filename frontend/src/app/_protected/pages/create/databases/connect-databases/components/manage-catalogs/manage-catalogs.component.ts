
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../../../../../../_general/services/sql.service';

/**
 * Helper component allowing you to view and administrate catalogs in
 * a database instance.
 */
@Component({
  selector: 'app-manage-catalogs',
  templateUrl: './manage-catalogs.component.html',
  styleUrls: ['./manage-catalogs.component.scss']
})
export class ManageCatalogsComponent {

  displayedColumns: string[] = ['name', 'tables', 'action'];

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  public deleteCatalog(item: any) {
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
          fieldToBeTypedTitle: `database name`,
          fieldToBeTypedValue: item.name,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.generalService.showLoading();
        this.sqlService.dropDatabase(
          this.data.item.dbTypeValue,
          this.data.item.cStringKey,
          item.name).subscribe({
            next: () => {
              this.generalService.hideLoading();
              this.data.list = this.data.list.filter((el: any) => el.name !== item.name);
              this.generalService.showFeedback('Database successfully deleted', 'successMessage');
            },
            error: (error: any) => {
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
              this.generalService.hideLoading();
          }});
      }
    });
  }
}
