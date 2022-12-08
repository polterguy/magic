import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { ColumnEx } from 'src/app/_protected/pages/create/endpoint-generator/_models/column-ex.model';
import { FKModel, ForeignKeyDialogComponent } from '../foreign-key-dialog/foreign-key-dialog.component';

@Component({
  selector: 'app-single-table-config',
  templateUrl: './single-table-config.component.html',
  styleUrls: ['./single-table-config.component.scss']
})
export class SingleTableConfigComponent implements OnInit, OnDestroy {

  @Input() selectedTable: string = '';
  @Input() selectedDatabase: string = '';
  @Input() databases: any = [];
  @Input() dbLoading: Observable<boolean>;

  displayedColumns: string[] = ['name', 'type', 'hyperlambda', 'nullable', 'key', 'default', 'locked', 'template', 'create', 'read', 'update', 'delete'];
  dataSource: any = [];

  public foreign_keys: any = {};

  public templateList: any = TemplateList;

  private dbLoadingSubscription!: Subscription;

  constructor(
    private dialog: MatDialog) { }

  ngOnInit(): void {
    this.watchDbLoading();
  }

  private watchDbLoading() {
    this.dbLoadingSubscription = this.dbLoading.subscribe((isLoading: boolean) => {
      this.dataSource = [];
      if (isLoading === false) {
        const db: any = this.databases.find((db: any) => db.name === this.selectedDatabase);
        const table: any = db.tables.find((table: any) => table.name === this.selectedTable.toString());

        this.foreign_keys = table?.foreign_keys!==null ? table.foreign_keys[0] : [] ;

        const columns = (table.columns || []);

        this.dataSource = table.columns;

        for (const idxColumn of columns) {

          idxColumn.post = !(idxColumn.automatic && idxColumn.primary);
          if (idxColumn.automatic && idxColumn.name?.toLowerCase() === 'created') {
            idxColumn.post = false;
          }
          idxColumn.get = true;
          idxColumn.put = !idxColumn.automatic || idxColumn.primary;
          idxColumn.delete = idxColumn.primary;

          idxColumn.postDisabled = false;
          idxColumn.getDisabled = false;
          idxColumn.putDisabled = idxColumn.primary;
          idxColumn.deleteDisabled = true;

          if ((idxColumn.name === 'user' || idxColumn.name === 'username') && idxColumn.hl === 'string') {
            idxColumn.locked = true;
          }

          if (idxColumn.name?.toLowerCase() === 'picture' || idxColumn.name?.toLowerCase() === 'image' || idxColumn.name?.toLowerCase() === 'photo') {
            idxColumn.handling = 'image';
          }

          if (idxColumn.name?.toLowerCase() === 'file') {
            idxColumn.handling = 'file';
          }

          if (idxColumn.name?.toLowerCase() === 'youtube' || idxColumn.name?.toLowerCase() === 'video') {
            idxColumn.handling = 'youtube';
          }

          if (idxColumn.name?.toLowerCase() === 'email' || idxColumn.name?.toLowerCase() === 'mail') {
            idxColumn.handling = 'email';
          }

          if (idxColumn.name?.toLowerCase() === 'url' || idxColumn.name?.toLowerCase() === 'link') {
            idxColumn.handling = 'url';
          }

          if (idxColumn.name?.toLowerCase() === 'phone' || idxColumn.name?.toLowerCase() === 'tel') {
            idxColumn.handling = 'phone';
          }
        }
      }
    })
  }

  public editForeignKey(columnName: string) {
    const db: any = this.databases.find((db: any) => db.name === this.selectedDatabase);
    const table: any = db.tables.find((table: any) => table.name === this.selectedTable.toString());
    this.dialog.open(ForeignKeyDialogComponent, {
      width: '500px',
      data: {
        database: db,
        foreign_keys: this.foreign_keys,
        currentForeignKey: table.foreign_keys.find((fk: any) => fk.column === columnName)
      }
    }).afterClosed().subscribe((res: { selectedForeignKey: FKModel }) => {
      if (res && res.selectedForeignKey) {
        const column: any = table.columns.find((column: any) => column.name === columnName);
        column.foreign_key = res.selectedForeignKey;
      }
    })
  }

  /**
   * Returns whether or not the specified HTTP verb is disabled
   * for the specified column.
   *
   * @param verb HTTP verb to check
   * @param column Column to check.
   */
  public verbForColumnIsDisabled(verb: string, column: ColumnEx) {
    switch (verb) {

      case 'post':
        return column.postDisabled;

      case 'get':
        return column.getDisabled;

      case 'put':
        return column.putDisabled;

      case 'delete':
        return column.deleteDisabled;
    }
  }

  ngOnDestroy(): void {
    if (this.dbLoadingSubscription) {
      this.dbLoadingSubscription.unsubscribe();
    }
  }
}

const TemplateList: any = {
  'textarea': 'Long text',
  'image': 'Image',
  'file': 'File',
  'email': 'Email',
  'url': 'URL',
  'youtube': 'YouTube',
  'phone': 'Phone',
  'username_lookup': 'Username lookup'
}
