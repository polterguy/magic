
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { AssumptionService } from 'src/app/_general/services/assumption.service';
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

  data: TestModel = {
    filename: '',
    description: '',
    matchResponse: false,
  };

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private dialogRef: MatDialogRef<CreateAssumptionTestDialogComponent>,
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  ngOnInit() {

    this.assumptionService.list().subscribe({
      next: (files: string[]) => {
        this.files = files.filter(x => x.endsWith('.hl'));
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  getFilename(path: string) {

    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  getFiltered() {

    return this.files.filter((idx: string) => {
      return this.getFilename(idx).indexOf(this.data.filename) !== -1;
    });
  }

  filenameValid() {

    return this.CommonRegEx.appNamesWithDot.test(this.data.filename);
  }

  create() {

    if (!this.filenameValid()) {
      this.generalService.showFeedback('Test name is not valid', 'errorMessage');
      return;
    }
    this.dialogRef.close(this.data)
  }
}
