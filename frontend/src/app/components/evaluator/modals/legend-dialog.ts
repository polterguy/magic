
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from '@angular/material';
import { CrudifyService } from 'src/app/services/crudify-service';
import { EvaluatorService } from 'src/app/services/evaluator-service';

@Component({
  templateUrl: 'legend-dialog.html',
  styleUrls: ['legend-dialog.scss'],
})
export class LegendDialogComponent {

  public selectedModule: string = null;
  public documentation = '';
  public modules: string[] = [
    'magic.data.common',
    'magic.endpoint',
    'magic.http',
    'magic.io',
    'magic.lambda',
    'magic.lambda.auth',
    'magic.lambda.config',
    'magic.lambda.crypto',
    'magic.lambda.http',
    'magic.lambda.hyperlambda',
    'magic.lambda.io',
    'magic.lambda.json',
    'magic.lambda.logging',
    'magic.lambda.mail',
    'magic.lambda.math',
    'magic.lambda.mime',
    'magic.lambda.mssql',
    'magic.lambda.mysql',
    'magic.lambda.scheduler',
    'magic.lambda.slots',
    'magic.lambda.strings',
    'magic.lambda.validators',
    'magic.library',
    'magic.node',
    'magic.signals',
  ];

  constructor(private evaluatorService: EvaluatorService) { }

  moduleChanged() {
    if (this.selectedModule === 'nope') {
      this.documentation = '';
      return;
    }
    this.evaluatorService.documentation(this.selectedModule).subscribe(res => {
      this.documentation = res.result;
    });
  }
}
