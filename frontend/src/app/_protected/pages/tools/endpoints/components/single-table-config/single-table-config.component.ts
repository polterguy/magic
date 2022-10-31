import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

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

  private dbLoadingSubscription!: Subscription;

  constructor() { }

  ngOnInit(): void {
    this.watchDbLoading();
  }

  private watchDbLoading() {
    this.dbLoadingSubscription = this.dbLoading.subscribe((isLoading: boolean) => {
      this.dataSource = [];
      if (isLoading === false) {
        const db: any = this.databases.find((db: any) => db.name === this.selectedDatabase);
        const table: any = db.tables.find((table: any) => table.name === this.selectedTable.toString());
        this.dataSource = table.columns;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.dbLoadingSubscription) {
      this.dbLoadingSubscription.unsubscribe();
    }
  }
}
