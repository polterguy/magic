
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
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
    'magic',
    'magic.lambda',
    'magic.lambda.io',
    'magic.lambda.auth',
    'magic.lambda.http',
    'magic.lambda.json',
    'magic.lambda.mail',
    'magic.lambda.math',
    'magic.lambda.mime',
    'magic.lambda.mssql',
    'magic.lambda.mysql',
    'magic.lambda.slots',
    'magic.lambda.config',
    'magic.lambda.crypto',
    'magic.lambda.strings',
    'magic.lambda.logging',
    'magic.lambda.scheduler',
    'magic.lambda.validators',
    'magic.lambda.hyperlambda',
    'magic.io',
    'magic.node',
    'magic.http',
    'magic.signals',
    'magic.library',
    'magic.endpoint',
    'magic.data.common',
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
