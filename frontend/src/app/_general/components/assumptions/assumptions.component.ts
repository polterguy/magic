import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AssumptionService } from 'src/app/_protected/pages/tools/health-check/_services/assumption.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { CreateAssumptionTestDialogComponent, TestModel } from '../create-assumption-test-dialog/create-assumption-test-dialog.component';
import { InvocationResult } from '../../../_protected/pages/administration/generated-endpoints/endpoints-result/endpoints-result.component';

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
  @Output() getAssumptionsist: EventEmitter<any> = new EventEmitter<any>();

  /**
   * Assumptions about endpoint.
   */
  assumptions: Assumption[] = [];

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private backendService: BackendService,
    private assumptionService: AssumptionService) { }

  ngOnInit(): void {
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

  /**
   * Allows the user to create an assumption/integration test for the current request/response.
   */
  createTest() {
    const dialogRef = this.dialog.open(CreateAssumptionTestDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((res: TestModel) => {
      if (res) {
        this.assumptionService.create(
          res.filename,
          this.itemDetails.verb,
          `/${this.itemDetails.path}`,
          this.result.status,
          res.description !== '' ? res.description : null,
          this.payload !== '' ? this.payload : null,
          (res.matchResponse && !this.result.blob) ? this.result.response : null,
          this.itemDetails.produces).subscribe({
            next: () => {
              /*
               * Snippet saved, showing user some feedback, and reloading assumptions.
               *
               * Checking if caller wants response to match, and response is blob,
               * at which point we inform user this is not possible.
               */
              if (res.matchResponse && this.result.blob) {
                this.generalService.showFeedback('Assumption successfully saved. Notice, blob types of invocations cannot assume response equality.', 'successMessage', 'Ok', 5000);
              } else {
                this.generalService.showFeedback('Assumption successfully saved', 'successMessage');
              }
              this.getAssumptions();

            },
            error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
          });
      }
    });
  }

  /*
   * Retrieves assumptions for endpoint
   */
  private getAssumptions() {
    if (this.backendService.active?.access.endpoints.assumptions) {
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
}
