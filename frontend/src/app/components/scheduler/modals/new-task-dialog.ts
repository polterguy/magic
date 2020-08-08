
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSelectChange, MatSnackBar } from '@angular/material';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { TaskModel } from 'src/app/models/task-model';
import { SchedulerService } from 'src/app/services/scheduler-service';

@Component({
  selector: 'new-task-dialog',
  templateUrl: 'new-task-dialog.html',
})
export class NewTaskDialogComponent implements OnInit {

  public taskId: string = null;
  public taskDescription: string = null;
  public taskHyperlambda: string;

  constructor(
    private evaluatorService: EvaluatorService,
    private schedulerService: SchedulerService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<NewTaskDialogComponent>) {
  }

  ngOnInit(): void {
    this.evaluatorService.vocabulary().subscribe(res => {
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

  saveTask(): void {
    if (this.taskId === '' || this.taskId === null) {
      this.showError('You have to provide an id for your task');
      return;
    }
    if (!this.taskHyperlambda || this.taskHyperlambda.length === 0) {
      this.showError('You have to provide some Hyperlambda for your task');
      return;
    }

    /*
     * If we come this far, no validation errors exists.
     */
    const task = new TaskModel();
    task.id = this.taskId;
    if (this.taskDescription !== null && this.taskDescription !== undefined) {
      task.description = this.taskDescription;
    }
    task.hyperlambda = this.taskHyperlambda;
    this.schedulerService.createTask(task).subscribe(res => {
      this.dialogRef.close();
    }, error => {
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
