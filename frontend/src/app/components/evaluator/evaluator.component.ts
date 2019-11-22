
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvaluatorService } from '../../services/evaluator-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent implements OnInit {
  private hyperlambda = `/*
 * Type in your Hyperlambda here.
 */
`;
  private result: string = null;

  constructor(
    private service: EvaluatorService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.service.vocabulary().subscribe((res) => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
    });
  }

  evaluate() {
    this.service.evaluate(this.hyperlambda).subscribe((res) => {
      this.result = res.result;
    }, (error) => {
      this.showHttpError(error);
    });
    return false;
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

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
