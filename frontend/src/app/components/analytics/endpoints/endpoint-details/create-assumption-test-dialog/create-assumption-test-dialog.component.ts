
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';
import { AssumptionService } from 'src/app/services/analytics/assumption.service';

/**
 * Result of dialog if user chooses to create a test.
 */
export class TestModel {

  /**
   * Filename to use for test.
   */
  filename: string;

  /**
   * Description for test.
   */
  description: string;

  /**
   * Whether or not response must match.
   */
  matchResponse: boolean;
}

/**
 * Modal dialog component allowing user to create an assumption/integration test
 * from a specified URL/payload/response object.
 */
@Component({
  selector: 'app-create-assumption-test-dialog',
  templateUrl: './create-assumption-test-dialog.component.html'
})
export class CreateAssumptionTestDialogComponent implements OnInit {

  /*
   * Existing assumption/integration test files as returned from backend.
   * 
   * Needed to make autocompleter working allowing user to overwrite previously saved test.
   */
  private files: string[] = [];

  /**
   * Test model to use when saving test.
   */
  public data: TestModel = {
    filename: '',
    description: '',
    matchResponse: false,
  };

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to show user feedback
   * @param assumptionService Needed to be able tolist and execute assumptions
   */
  constructor(
    private feedbackService: FeedbackService,
    private assumptionService: AssumptionService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving snippets from backend.
    this.assumptionService.list().subscribe((files: string[]) => {

      // Excluding all files that are not Hyperlambda files.
      this.files = files.filter(x => x.endsWith('.hl'));

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  public getFilename(path: string) {

    // Removing path and extension, returning only filename.
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  public getFiltered() {

    // Filtering files according such that only filtered files are returned.
    return this.files.filter((idx: string)  => {
      return this.getFilename(idx).indexOf(this.data.filename) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  public filenameValid() {

    // A valid filename only contains [a-z], [0-9], '.' and '-'.
    for (var idx of this.data.filename) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-_'.indexOf(idx) === -1) {
        return false;
      }
    }
    return this.data.filename.length > 0;
  }
}
