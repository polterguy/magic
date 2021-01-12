
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EndpointService } from '../../endpoints/services/endpoint.service';

/*
 * Test model encapsulating a single test, and possibly its result.
 */
class TestModel {

  // Filename for test.
  filename: string;

  // Whether or not execution was a success or not.
  success?: boolean;

  // Descriptive text for assumption test.
  description?: string;
}

/**
 * Assumption/integration test runner for verifying integrity of system.
 */
@Component({
  selector: 'app-diagnostics-tests',
  templateUrl: './diagnostics-tests.component.html',
  styleUrls: ['./diagnostics-tests.component.scss']
})
export class DiagnosticsTestsComponent implements OnInit {

  /**
   * List of all tests in system.
   */
  public tests: TestModel[] = [];

  public runAllText: string = 'Run all';

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all tests from backend
   */
  constructor(
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving all tests form backend.
    this.endpointService.tests().subscribe((tests: string[]) => {

      // Assigning result to model.
      this.tests = tests.filter(x => x.endsWith('.hl')).map(x => {
        return {
          filename: x,
          success: null,
        }
      });

      // Retrieving description for tests.
      const all = this.tests.map(x => this.endpointService.getDescription(x.filename));
      forkJoin(all).subscribe((result: Response[]) => {

        // Looping through all tests and assigning description to them.
        for (let idxNo = 0; idxNo < all.length; idxNo++) {
          this.tests[idxNo].description = result[idxNo].result;
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns test name, without its path parts.
   * 
   * @param path Complete path for test
   */
  public getName(path: string) {

    // Stripping away path parts, in addition to extension.
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.length - 3);
  }

  /**
   * Runs the specified test.
   * 
   * @param el Full path to test
   */
  public executeTest(test: TestModel) {

    // Invoking backend to execute the test.
    this.endpointService.executeTest(test.filename).subscribe((res: Response) => {

      // Assigning result of test execution to model.
      test.success = res.result === 'success';

    }, (error: any) => {

      // Oops, test raised an exception (or something).
      test.success = false;
      this.feedbackService.showError(error);
    });
  }

  /**
   * Invoked when user wants to execute all tests.
   */
  public executeAll() {

    // Creating invocations towards backend for each test we have in our test suite.
    const all = this.tests.map(x => this.endpointService.executeTest(x.filename));
    forkJoin(all).subscribe((res: Response[]) => {

      // Figuring out if we had any errors, and if so, making sure failed tests are marked as such.
      let noErrors = 0;
      let idxNo = 0;
      for (var idx of res) {
        if (idx.result !== 'success') {
          noErrors += 1;
          this.tests[idxNo++].success = false;
        } else {
          this.tests[idxNo++].success = true;
        }
      }

      // Checking if we had more than 0 errors, and if so, displaying error message to user.
      if (noErrors > 0) {
        this.feedbackService.showError(`${noErrors} assumption tests out of ${idxNo} failed`);
        this.runAllText = `${noErrors} tests failed`;
      } else {
        this.feedbackService.showInfoShort(`${idxNo} tests executed successfully`);
        this.runAllText = 'Success';
      }
    });
  }
}
