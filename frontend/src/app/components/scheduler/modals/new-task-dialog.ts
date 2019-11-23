
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EvaluatorService } from 'src/app/services/evaluator-service';

export interface NewTaskDialogData {
  filename: string;
}

@Component({
  selector: 'new-task-dialog',
  templateUrl: 'new-task-dialog.html',
})
export class NewTaskDialogComponent implements OnInit {

  private taskHyperlambda: string;

  constructor(
    private service: EvaluatorService,
    public dialogRef: MatDialogRef<NewTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewTaskDialogData) {
  }

  ngOnInit(): void {
    this.service.vocabulary().subscribe(res => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
      }
    };
  }

  close(): void {
    this.dialogRef.close();
  }
}
