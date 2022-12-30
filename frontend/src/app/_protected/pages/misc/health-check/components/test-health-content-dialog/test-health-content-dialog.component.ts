
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';
import { FileService } from 'src/app/_protected/pages/create/hyper-ide/services/file.service';
import { EvaluatorService } from '../../../../../../_general/services/evaluator.service';
import { AssumptionService } from '../../../../../../_general/services/assumption.service';

/**
 * Helper modal dialog to allow user to view and manage an individual test case.
 */
@Component({
  selector: 'app-test-health-content-dialog',
  templateUrl: './test-health-content-dialog.component.html'
})
export class TestHealthContentDialogComponent implements OnInit, OnDestroy {

  private codemirrorActionSubscription!: Subscription;
  public codemirrorOptionsReady: boolean = false;

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private generalService: GeneralService,
    private evaluatorService: EvaluatorService,
    private assumptionService: AssumptionService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TestHealthContentDialogComponent>,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.getCodeMirrorOptions();
    this.watchForActions();
  }

  private async getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, 'hl').then((res: any) => {
      if (res) {
        this.data.content.options = res;
        setTimeout(() => {
          this.codemirrorOptionsReady = true;
        }, 100);
      }
    });
  }

  private watchForActions() {
    this.codemirrorActionSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {

        case 'save':
          this.saveTest();
          break;

        case 'insertSnippet':
          this.load();
          break;

        case 'execute':
          this.executeTest();
          break;
      }
    })
  }

  load() {
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            this.data.content.hyperlambda = content;
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  public saveTest() {
    this.fileService.saveFile(this.data.filename, this.data.content).subscribe({
      next: () => {
        this.generalService.showFeedback('Assumption successfully saved', 'successMessage', 'Ok', 3000);
        this.dialogRef.close();
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  public executeTest() {
    this.assumptionService.execute(this.data.filename).subscribe({
      next: (res: any) => {
        this.data.success = res.result === 'success';
        this.data.status = res.result === 'success' ? 'Passed' : 'Failed';
        if (res.result === 'success') {
          this.generalService.showFeedback('Assumption succeeded', 'successMessage');
        } else {
          this.generalService.showFeedback('Assumption failed, please check the logs.', 'errorMessage', 'Ok', 5000);
        }
      },
      error: (error: any) => {
        this.data.success = false;
        this.data.status = 'Failed';
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  ngOnDestroy() {
    if (this.codemirrorActionSubscription) {
      this.codemirrorActionSubscription.unsubscribe();
    }
  }
}
