
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';
import { AssumptionService } from 'src/app/_protected/pages/setting-security/health-check/_services/assumption.service';

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

  private files: string[] = [];

  /**
   * Test model to use when saving test.
   */
  data: TestModel = {
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
  ngOnInit() {
    this.assumptionService.list().subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.hl'));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   *
   * @param path Complete path of file
   */
  getFilename(path: string) {
    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  getFiltered() {
    return this.files.filter((idx: string)  => {
      return this.getFilename(idx).indexOf(this.data.filename) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  filenameValid() {
    for (var idx of this.data.filename) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-_'.indexOf(idx) === -1) {
        return false;
      }
    }
    return this.data.filename.length > 0;
  }
}
