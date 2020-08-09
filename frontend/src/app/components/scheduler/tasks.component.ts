
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar, MatDialog, MatSlideToggleChange, MatPaginator, PageEvent } from '@angular/material';
import { TaskService } from 'src/app/services/scheduler-service';
import { TaskModel } from 'src/app/models/task-model';
import { NewTaskDialogComponent } from './modals/new-task-dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { ConfirmDeletionTaskDialogComponent } from './modals/confirm-deletion-dialog';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  public schedulerState: string;
  public isRunning: boolean;
  public nextDue: string;
  public displayedColumns = ['id', 'description', 'delete'];
  public tasks: any[];
  public selectedTask: TaskModel = null;
  public filter: string = null;
  public offset = 0;
  public count: number;
  public filterFormControl: FormControl;

  // Need to view paginator as a child to update page index of it.
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private evaluatorService: EvaluatorService,
    private taskService: TaskService) {
  }

  ngOnInit(): void {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filter = query;
        this.offset = 0;
        this.paginator.pageIndex = 0;
        this.getTasks();
      });
    this.getTasks();
    this.taskService.isRunning().subscribe(res => {
      this.isRunning = res['is-running'];
      if (this.isRunning) {
        this.schedulerState = 'Stop scheduler';
        this.taskService.nextDue().subscribe(res => {
          this.nextDue = res.next;
        });
    } else {
        this.schedulerState = 'Start scheduler';
      }
    });
  }

  isRunningChanged(e: MatSlideToggleChange) {
    if (e.checked) {
      this.taskService.turnOn().subscribe(res => {
        if (res.result === 'OK') {
          this.schedulerState = 'Stop scheduler';
          this.showHttpSuccess('Scheduler was successfully started');
          this.taskService.nextDue().subscribe(res => {
            this.nextDue = res.next;
            this.isRunning = true;
          });
        } else {
          this.showHttpError(res.status);
        }
      });
    } else {
      this.taskService.turnOff().subscribe(res => {
        this.schedulerState = 'Start scheduler';
        this.isRunning = false;
        this.nextDue = null;
      });
    }
  }

  getTasks() {
    this.taskService.listTasks(this.filter, this.offset).subscribe(res => {
      this.tasks = res || [];
      this.taskService.countTasks(this.filter).subscribe(res => {
        this.count = res.count;
      });
    });
  }

  paged(e: PageEvent) {
    this.offset = e.pageSize * e.pageIndex;
    this.getTasks();
  }

  createNewTask() {
    const dialogRef = this.dialog.open(NewTaskDialogComponent, {
      width: '1000px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(res => {
      this.filter = '';
      this.getTasks();
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
        'Alt-Space': 'autocomplete',
        'Alt-M': (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        },
        Esc: (cm: any) => {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        },
        F5: (cm: any) => {
          const element = document.getElementById('executeButton') as HTMLElement;
          element.click();
        }
      }
    };
  }

  selectTask(task: any) {
    this.selectedTask = task;
      if (!this.selectedTask.hyperlambda) {
      this.taskService.getTask(task.id).subscribe(res => {
        this.selectedTask.hyperlambda = res.hyperlambda;
      });
    }
  }

  runTask() {
    this.evaluatorService.evaluate(this.selectedTask.hyperlambda).subscribe(res => {
      this.showHttpSuccess('Task was evaluated successfully');
    }, error => {
      this.showHttpError(error);
    });
  }

  closeTask() {
    this.selectedTask = null;
  }

  updateTask() {
    this.taskService.updateTask({
      id: this.selectedTask.id,
      hyperlambda: this.selectedTask.hyperlambda,
      description: this.selectedTask.description,
    }).subscribe(res => {
      this.showHttpSuccess('Task was successfully updated');
    });
  }

  delete(el: any) {
    const dialogRef = this.dialog.open(ConfirmDeletionTaskDialogComponent, {
      width: '500px',
      data: {
        task: el.id
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        this.taskService.deleteTask(el.id).subscribe(res2 => {
          this.showHttpSuccess('Task was successfully deleted');
          this.getTasks();
        });
      }
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error ? error.error.message : error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
