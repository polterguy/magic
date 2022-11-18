import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { bufferCount, concatMap, forkJoin, from, Observable } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { Response } from 'src/app/_protected/models/common/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { FileService } from '../../tools/hyper-ide/_services/file.service';
import { AssumptionService } from '../../setting-security/health-check/_services/assumption.service';

// CodeMirror options.
import hyperlambda from 'src/app/codemirror/options/hyperlambda.json';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { TestHealthContentDialogComponent } from '../../setting-security/health-check/components/test-health-content-dialog/test-health-content-dialog.component';

/*
 * Test model encapsulating a single test, and possibly its result.
 */
class TestModel {

  // Filename for test.
  filename: string;

  // Whether or not execution was a success or not.
  success?: boolean;

  // Content of test.
  content?: Model;
}

@Component({
  selector: 'app-health-check',
  templateUrl: './health-check.component.html',
  styleUrls: ['./health-check.component.scss']
})
export class HealthCheckComponent implements OnInit {

  // Filter for which items to display.
  private filter: string = '';

  /**
   * List of all tests in system.
   */
  private list: TestModel[] = [];

  /**
   * Currently expanded assumption.
   */
  expandedElement: TestModel;

  public originalDataSource: any = [];
  public dataSource: any = [];
  public displayedColumns: string[] = ['name', 'status', 'action'];

  public isLoading: boolean = true;

  /**
   * Creates an instance of your component.
   *
   * @param fileService Needed to load test files from backend
   * @param messageService Needed to publish message when all assumptions succeeds
   * @param feedbackService Needed to provide feedback to user
   * @param loaderInterceptor Used to manually increment invocation count to avoid flickering as we execute all tests
   * @param assumptionService Needed to be able to create and execute assumptions
   */
  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private fileService: FileService,
    public backendService: BackendService,
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.getList();
  }

  private getList() {
    this.assumptionService.list().subscribe({
      next: (tests: string[]) => {
        // this.list = tests.filter(x => x.endsWith('.hl')).map(x => {
        //   return {
        //     filename: x,
        //     success: null,
        //     content: null,
        //   }
        // });
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
      error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
  }

  /**
   * Toggles the details view for a single test.
   *
   * @param test Test to toggle details for
   */
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
        error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
    }
  }

  private openContent(item: any) {
    this.dialog.open(TestHealthContentDialogComponent, {
      width: '900px',
      data: item,
      panelClass: ['light']
    })
  }

  /**
   * Runs the specified test.
   *
   * @param item item to be tested.
   */
  executeTest(item: any) {
    this.assumptionService.execute(item.filename).subscribe({
      next: (res: Response) => {
        item.success = res.result === 'success';
        item.status = res.result === 'success' ? 'Passed' : 'Failed';
        if (res.result === 'success') {
          this.generalService.showFeedback('Assumption succeeded', 'successMessage');
        } else {
          this.generalService.showFeedback('Assumption failed, please check the logs.', 'errorMessage', 'Ok', 5000);
        }
      },
      error: (error: any) => {
        item.success = false;
        item.status = 'Failed';
        this.generalService.showFeedback(error?.error?.message??error, 'errorMessage');
      }});
  }

  /**
   * Deletes the specified assumption test.
   *
   * @param test Test to delete
   */
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
          error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
      }
    });
  }



  /**
   * Invoked when user wants to execute all tests.
   */
  public testAll() {
    const parallellNo = 2;
    let idxNo = 0;

    // Measuring time tests requires to execute
    const startTime = new Date();
    let timeDiff: number = null;

    from(this.dataSource.map(x => this.assumptionService.execute(x.filename)))
      .pipe(
        bufferCount(parallellNo),
        concatMap(buffer => forkJoin(buffer))).subscribe({
          next: (results:any) => {
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
            this.generalService.showFeedback(error?.error?.message??error, 'errorMessage');

            /*
             * Filtering out tests according to result,
             * and making sure Ajax loader is hidden again.
             *
             * Notice, we can't use decrement here, because as one of our
             * requests results in an error, all callbacks for all
             * consecutive requests stops being invoked.
             */
            this.filterTests();

          },
          complete: () => {

            this.filterTests(timeDiff);
          }});
  }

  /*
   * Private helper methods
   */

   /*
    * Filters tests according to result.
    */
   private filterTests(timeDiff: number = null) {
    if (this.dataSource.filter(x => x.success !== true).length === 0) {

      // Perfect health! Publishing succeeded message and showing user some feedback.
      this.generalService.showFeedback('All tests succeeded' + (timeDiff !== null ? ' in ' + new Intl.NumberFormat('en-us').format(timeDiff) + ' milliseconds' : ''), 'successMessage', 'Ok', 5000);

    } else {

      // One or more tests failed, removing all successful tests.
      this.generalService.showFeedback('One or more assumptions failed!', 'errorMessage', 'Ok', 5000);
      this.dataSource = this.dataSource.filter(x => x.success !== true);
    }
  }

  public filterList(event: string) {
    if (event !== '') {
      this.dataSource = this.originalDataSource.filter((item: any) => item.name.indexOf(event) > -1);
    } else {
      this.dataSource = this.originalDataSource;
    }
  }

}
