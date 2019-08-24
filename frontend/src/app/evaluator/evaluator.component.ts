
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvaluatorService } from '../services/evaluator-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent implements OnInit {
  private hyperlambda: string;
  private result: string;

  constructor(
    private service: EvaluatorService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  evaluate() {
    this.service.evaluate(this.hyperlambda).subscribe((res) => {
      this.result = res.result;
    }, (error) => {
      this.showHttpError(error);
    });
    return false;
  }

  showHttpError(error: any) {
    console.error(error);
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
