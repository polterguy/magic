
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { AssumptionService } from 'src/app/_general/services/assumption.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { InvocationResult } from '../../../_protected/pages/manage/endpoints/endpoints-result/endpoints-result.component';

/*
 * Assumption model for showing tests associated with endpoints.
 */
class Assumption {
  file: string;
  description: string
  success?: boolean;
  name?: string // in app only
}

/**
 * Helper component that displays assumptions for one single endpoint, allowing user to
 * run the assumption.
 */
@Component({
  selector: 'app-assumptions',
  templateUrl: './assumptions.component.html',
  styleUrls: ['./assumptions.component.scss']
})
export class AssumptionsComponent implements OnInit {

  @Input() itemDetails!: any;
  @Input() result: InvocationResult = null;
  @Input() payload: any;

  assumptions: Assumption[] = [];

  constructor(
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  ngOnInit() {

    this.getAssumptions();
  }

  getAssumptionName(path: string) {

    const name = path.substring(path.lastIndexOf('/') + 1);
    return name.substring(0, name.length - 3);
  }

  runAssumption(assumption: Assumption) {

    this.generalService.showLoading();
    this.assumptionService.execute(assumption.file).subscribe({

      next: (res: any) => {

        this.generalService.hideLoading();
        if (res.result === 'success') {

          assumption.success = true;

        } else {

          this.generalService.showFeedback('Test failed, check log for details', 'errorMessage');
          assumption.success = false;
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        assumption.success = false;
      }
    });
  }

  getAssumptions() {

    this.assumptionService.list('/' + this.itemDetails.path, this.itemDetails.verb).subscribe({
      next: (assumptions: any) => {

        if (assumptions && assumptions.length) {
          const arr: Assumption[] = [];
          assumptions.forEach((element: any) => {
            const name = element.file.substring(element.file.lastIndexOf('/') + 1);
            arr.push({
              file: element.file,
              description: element.description,
              success: null,
              name: name.substring(0, name.length - 3)
            });
          });
          this.assumptions = arr;
        }
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }
}
