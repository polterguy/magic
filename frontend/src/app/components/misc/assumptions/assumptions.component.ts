
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { forkJoin, from } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { bufferCount, concatMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Response } from '../../../models/response.model';
import { FileService } from 'src/app/services/file.service';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from '../../../services/message.service';
import { FeedbackService } from '../../../services/feedback.service';
import { LoaderInterceptor } from '../../../interceptors/loader.interceptor';
import { AssumptionService } from 'src/app/_protected/pages/tools/health-check/_services/assumption.service';
import { Model } from '../../utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../../utilities/codemirror/options/hyperlambda.json';

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

/**
 * Assumption/integration test runner for verifying integrity of system.
 */
@Component({
  selector: 'app-assumptions',
  templateUrl: './assumptions.component.html',
  styleUrls: ['./assumptions.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class DiagnosticsTestsComponent implements OnInit {

  // Filter for which items to display.
  private filter: string = '';

  /**
   * List of all tests in system.
   */
  tests: TestModel[] = [];

  /**
   * Currently expanded assumption.
   */
  expandedElement: TestModel;

  /**
   * Filter form control for filtering users to display.
   */
  filterFormControl: FormControl;

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
    private fileService: FileService,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private loaderInterceptor: LoaderInterceptor,
    private assumptionService: AssumptionService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        this.filter = query;
    });

    this.assumptionService.list().subscribe({
      next: (tests: string[]) => {
        this.tests = tests.filter(x => x.endsWith('.hl')).map(x => {
          return {
            filename: x,
            success: null,
            content: null,
          }
        });
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to clear filter.
   */
  clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Returns tests that should be display due to matching filter condition.
   */
  getFilteredTests() {
    return this.tests.filter(x => x.filename.indexOf(this.filter) !== -1);
  }

  /**
   * Returns test name, without its path parts.
   *
   * @param path Complete path for test
   */
  getName(path: string) {
    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.length - 3);
  }

  /**
   * Toggles the details view for a single test.
   *
   * @param test Test to toggle details for
   */
  ensureTestContent(test: TestModel) {
    if (test.content) {
      return;
    } else {
      this.fileService.loadFile(test.filename).subscribe({
        next: (file: string) => {
          test.content = {
            hyperlambda: file,
            options: hyperlambda,
          };

          setTimeout(() => {
            document.querySelectorAll('.CodeMirror').forEach(item => {
              var domNode = (<any>item);
              var editor = domNode.CodeMirror;
              editor.doc.markClean();
              editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
            })
          }, 800);
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Runs the specified test.
   *
   * @param test Test we should execute
   */
  executeTest(test: TestModel) {
    this.assumptionService.execute(test.filename).subscribe({
      next: (res: Response) => {
        test.success = res.result === 'success';
        if (res.result === 'success') {
          this.feedbackService.showInfoShort('Assumption succeeded');
        } else {
          this.feedbackService.showError('Assumption failed, check your log to see why');
        }
      },
      error: (error: any) => {
        test.success = false;
        this.feedbackService.showError(error);
      }});
  }

  /**
   * Deletes the specified assumption test.
   *
   * @param test Test to delete
   */
  deleteTest(test: TestModel) {
    this.feedbackService.confirm(
      'Please confirm action',
      'Are you sure you want to delete the specified assumption?',
      () => {
        this.fileService.deleteFile(test.filename).subscribe({
          next: () => {
            this.feedbackService.showInfo('Assumption successfully deleted');
            this.tests.splice(this.tests.indexOf(test), 1);
            this.tests = this.tests.filter(x => true); // TODO: Use cdRef ...?
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    );
  }

  /**
   * Saves an assumption test.
   *
   * @param filename Filename of test
   * @param content Content of test
   */
  saveTest(filename: string, content: string) {
    this.fileService.saveFile(filename, content).subscribe({
      next: () => this.feedbackService.showInfoShort('Assumption successfully saved'),
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to execute all tests.
   */
  executeFiltered() {
    const parallellNo = 2;
    let idxNo = 0;

    // Measuring time tests requires to execute
    const startTime = new Date();
    let timeDiff: number = null;

    // Avoid flickering in Ajax wait gif bugger.
    this.loaderInterceptor.increment();

    from(this.getFilteredTests().map(x => this.assumptionService.execute(x.filename)))
      .pipe(
        bufferCount(parallellNo),
        concatMap(buffer => forkJoin(buffer))).subscribe({
          next: (results: Response[]) => {
            const endTime = new Date();
            timeDiff = endTime.getTime() - startTime.getTime();

            /*
             * Marking test as either failure or success,
             * depending upon return value from backend.
             */
            const filtered = this.getFilteredTests();
            for (let idx of results) {
              filtered[idxNo].success = idx.result === 'success';
              idxNo++;
            }
          },
          error: (error: any) => {
            this.feedbackService.showError(error);

            /*
             * Filtering out tests according to result,
             * and making sure Ajax loader is hidden again.
             *
             * Notice, we can't use decrement here, because as one of our
             * requests results in an error, all callbacks for all
             * consecutive requests stops being invoked.
             */
            this.loaderInterceptor.forceHide();
            this.filterTests();

          },
          complete: () => {
            this.loaderInterceptor.decrement();
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
    if (this.getFilteredTests().filter(x => x.success !== true).length === 0) {

      // Perfect health! Publishing succeeded message and showing user some feedback.
      this.feedbackService.showInfo('All tests succeeded' + (timeDiff !== null ? ' in ' + new Intl.NumberFormat('en-us').format(timeDiff) + ' milliseconds' : ''));
      this.messageService.sendMessage({
        name: 'app.assumptions.succeeded',
      });

    } else {

      // One or more tests failed, removing all successful tests.
      this.feedbackService.showError('One or more assumptions failed!');
      this.tests = this.tests.filter(x => x.success !== true);
    }
  }
}
