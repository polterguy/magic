
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FileService } from '../../files/services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EndpointService } from '../../endpoints/services/endpoint.service';
import { Model } from '../../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../../codemirror/options/hyperlambda.json';

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

  // Content of test.
  content?: Model;
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

  /**
   * What tests are currently being edited and viewed.
   */
  public selectedTests: string[] = [];

  /**
   * Text of 'Run all' button.
   */
  public runAllText: string = 'Run all';

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to load test files from backend
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all tests from backend
   */
  constructor(
    private fileService: FileService,
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
          content: null,
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
   * Toggles the details view for a single test.
   * 
   * @param test Test to toggle details for
   */
  public toggleDetails(test: TestModel) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedTests.indexOf(test.filename);
    if (idx !== -1) {

      // Hiding item.
      this.selectedTests.splice(idx, 1);

    } else {

      // Displaying item.
      this.selectedTests.push(test.filename);

      // Retrieving test file from backend.
      this.fileService.loadFile(test.filename).subscribe((file: string) => {
        test.content = {
          hyperlambda: file,
          options: hyperlambda,
        };
      });
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  public shouldDisplayDetails(user: TestModel) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedTests.filter(x => x === user.filename).length > 0;
  }

  /**
   * Saves an assumption test.
   * 
   * @param filename Filename of test
   * @param content Content of test
   */
  public saveTest(filename: string, content: string) {

    // Invoking backend to save test.
    this.fileService.saveFile(filename, content).subscribe(() => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort('Assumption successfully saved');
    });
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

      // Providing feedback to user.
      if (res.result === 'success') {
        this.feedbackService.showInfoShort('Success');
      } else {
        this.feedbackService.showError('Assumption failed, check your log to see why');
      }

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

        // At least one test failed.
        this.feedbackService.showError(`${noErrors} assumption tests out of ${idxNo} failed`);
        this.runAllText = `${noErrors} tests failed`;

      } else {

        // All tests succeeded.
        this.feedbackService.showInfoShort(`${idxNo} tests executed successfully`);
        this.runAllText = 'Success';
      }
    });
  }
}
