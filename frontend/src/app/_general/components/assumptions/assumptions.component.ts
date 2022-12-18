
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AssumptionService } from 'src/app/_general/services/assumption.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { InvocationResult } from '../../../_protected/pages/manage/endpoints/endpoints-result/endpoints-result.component';

/*
 * Assumption model for existing tests endpoint has declared.
 */
class Assumption {
  file: string;
  description: string
  success?: boolean;
  name?: string // in app only
}

@Component({
  selector: 'app-assumptions',
  templateUrl: './assumptions.component.html',
  styleUrls: ['./assumptions.component.scss']
})
export class AssumptionsComponent implements OnInit {

  @Input() itemDetails!: any;
  @Input() result: InvocationResult = null;
  @Input() payload: any;

  /**
   * Assumptions about endpoint.
   */
  assumptions: Assumption[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private assumptionService: AssumptionService) { }

  ngOnInit() {
    this.getAssumptions();
  }

  /**
   * Returns assumption name to caller.
   *
   * @param path Full path of assumption
   */
  getAssumptionName(path: string) {
    const name = path.substring(path.lastIndexOf('/') + 1);
    return name.substring(0, name.length - 3);
  }

  /**
   * Runs the specified assumption, and giving feedback to user if it was successfully assumed or not.
   *
   * @param assumption What assumption to run
   */
  runAssumption(assumption: any) {
    this.assumptionService.execute(assumption.file).subscribe({
      next: (res: any) => {
        if (res.result === 'success') {
          assumption.success = true;
        } else {
          this.generalService.showFeedback('Test failed, check log for details', 'errorMessage', 'Ok', 5000);
          assumption.success = false;
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        assumption.success = false;
      }
    });
  }

  /*
   * Retrieves assumptions for endpoint
   */
  public getAssumptions() {
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
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
    });
  }
}
