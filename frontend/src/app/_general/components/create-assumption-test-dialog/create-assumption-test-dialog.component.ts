
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { AssumptionService } from 'src/app/_protected/pages/misc/health-check/_services/assumption.service';
import { CommonErrorMessages } from '../../classes/common-error-messages';
import { CommonRegEx } from '../../classes/common-regex';
import { GeneralService } from '../../services/general.service';

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
  templateUrl: './create-assumption-test-dialog.component.html',
  styleUrls: ['./create-assumption-test-dialog.component.scss']
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

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  /**
   * Creates an instance of your component.
   *
   * @param generalService Needed to show user feedback
   * @param assumptionService Needed to be able tolist and execute assumptions
   */
  constructor(
    private dialogRef: MatDialogRef<CreateAssumptionTestDialogComponent>,
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.assumptionService.list().subscribe({
      next: (files: string[]) => {
        this.files = files.filter(x => x.endsWith('.hl'));
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
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
    return this.files.filter((idx: string) => {
      return this.getFilename(idx).indexOf(this.data.filename) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  filenameValid() {
    return this.CommonRegEx.appNamesWithDot.test(this.data.filename);
  }

  public create() {
    if (!this.filenameValid()) {
      this.generalService.showFeedback('Test name is not valid.', 'errorMessage');
      return;
    }
    this.dialogRef.close(this.data)
  }
}
