
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { bufferCount, concatMap, forkJoin, from } from 'rxjs';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { FileService } from '../../../../_general/services/file.service';
import { AssumptionService } from '../../../../_general/services/assumption.service';

// CodeMirror options.
import hyperlambda from 'src/app/codemirror/options/hyperlambda.json';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { TestHealthContentDialogComponent } from './components/test-health-content-dialog/test-health-content-dialog.component';
import { Sort } from '@angular/material/sort';

/**
 * Helper component to show user all test cases in the system, allowing him to run all tests,
 * verify sanity of system, and also administer existing test cases.
 */
@Component({
  selector: 'app-health-check',
  templateUrl: './health-check.component.html',
  styleUrls: ['./health-check.component.scss']
})
export class HealthCheckComponent implements OnInit {

  originalDataSource: any = [];
  dataSource: any = [];
  displayedColumns: string[] = ['name', 'status', 'action'];
  isLoading: boolean = true;
  isRunning: boolean = false;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private fileService: FileService,
    public backendService: BackendService,
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  ngOnInit() {
    this.getList();
  }

  ensureTestContent(item: any) {
    if (item.content) {
      this.openContent(item);
      return;
    } else {
      this.fileService.loadFile(item.filename).subscribe({
        next: (file: string) => {
          item.content = {
            hyperlambda: file,
            options: hyperlambda,
          };

          this.openContent(item);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }
  }

  executeTest(item: any) {
    this.isRunning = true;
    this.assumptionService.execute(item.filename).subscribe({
      next: (res: MagicResponse) => {
        this.isRunning = false;
        item.success = res.result === 'success';
        item.status = res.result === 'success' ? 'Passed' : 'Failed';
        if (res.result === 'success') {
          this.generalService.showFeedback('Assumption succeeded', 'successMessage');
        } else {
          this.generalService.showFeedback('Assumption failed, please check the logs.', 'errorMessage', 'Ok', 5000);
        }
      },
      error: (error: any) => {
        this.isRunning = false;
        item.success = false;
        item.status = 'Failed';
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  deleteTest(item: any) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${item.filename}`,
        description_extra: 'You are deleting the selected test case. Do you want to continue?',
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((res: string) => {
      if (res && res === 'confirm') {
        this.fileService.deleteFile(item.filename).subscribe({
          next: () => {
            this.generalService.showFeedback('Assumption successfully deleted', 'successMessage');
            this.dataSource = this.dataSource.filter((el: any) => el.filename !== item.filename);
            this.originalDataSource = this.originalDataSource.filter((el: any) => el.filename !== item.filename);
            this.cdr.detectChanges();
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  testAll() {
    const parallellNo = 2;
    let idxNo = 0;

    // Measuring time tests requires to execute
    const startTime = new Date();
    let timeDiff: number = null;
    this.generalService.showLoading();
    this.isRunning = true;
    from(this.dataSource.map((x: any) => this.assumptionService.execute(x.filename)))
      .pipe(
        bufferCount(parallellNo),
        concatMap((buffer: any) => forkJoin(buffer))).subscribe({
          next: (results: any) => {
            const endTime = new Date();
            timeDiff = endTime.getTime() - startTime.getTime();

            /*
             * Marking test as either failure or success,
             * depending upon return value from backend.
             */
            const filtered = this.dataSource;
            for (let idx of results) {
              filtered[idxNo].success = idx.result === 'success';
              filtered[idxNo].status = idx.result === 'success' ? 'Passed' : 'Failed';
              idxNo++;
            }
          },
          error: (error: any) => {
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            this.filterTests();
          },
          complete: () => {
            this.generalService.hideLoading();
            this.filterTests(timeDiff);
            this.isRunning = false;
          }
        });
  }

  public filterList(event: { searchKey: string }) {
    if (event.searchKey) {
      this.dataSource = this.originalDataSource.filter((item: any) => item.name.indexOf(event.searchKey) > -1);
    } else {
      this.dataSource = this.originalDataSource;
    }
  }

  sortData(sort: Sort) {
    const data = this.originalDataSource.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource = data;
      return;
    }

    this.dataSource = data.sort((a: any, b: any) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {

        case 'name':
          return compare(a.name, b.name, isAsc);

        case 'status':
          return compare(a.status, b.status, isAsc);

        default:
          return 0;
      }
    });
  }

  /*
   * Private helper methods
   */

  private getList() {
    this.assumptionService.list().subscribe({
      next: (tests: string[]) => {
        let tableData: any;
        tableData = tests.filter(x => x.endsWith('.hl')).map((item: any) => {
          const name = item.substring(item.lastIndexOf('/') + 1);
          return {
            status: 'Untested',
            name: name.substring(0, name.length - 3),
            filename: item,
            success: null,
            content: null,
          }
        });
        this.originalDataSource = [...tableData];
        this.dataSource = tableData;

        this.isLoading = false;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private filterTests(timeDiff: number = null) {

    if (this.dataSource.filter((x: any) => x.success !== true).length === 0) {
      this.generalService.showFeedback('All tests succeeded' + (timeDiff !== null ? ' in ' + new Intl.NumberFormat('en-us').format(timeDiff) + ' milliseconds' : ''), 'successMessage', 'Ok', 5000);
    } else {
      this.generalService.hideLoading();
      this.generalService.showFeedback('One or more tests failed!', 'errorMessage', 'Ok', 5000);
    }
  }

  private openContent(item: any) {
    this.dialog.open(TestHealthContentDialogComponent, {
      width: '900px',
      data: item,
      panelClass: ['light']
    })
  };
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
