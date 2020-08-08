
import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog, MatSlideToggleChange } from '@angular/material';
import { SchedulerService } from 'src/app/services/scheduler-service';
import { TaskModel } from 'src/app/models/task-model';
import { NewTaskDialogComponent } from './modals/new-task-dialog';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { ConfirmDeletionTaskDialogComponent } from './modals/confirm-deletion-dialog';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  public schedulerState: string;
  public isRunning: boolean;
  public nextDue: string;
  public displayedColumns = ['id', 'description', 'delete'];
  public tasks: any[];
  public selectedTask: TaskModel = null;
  public filter: string = null;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private evaluatorService: EvaluatorService,
    private schedulerService: SchedulerService) {
  }

  ngOnInit(): void {
    this.getTasks();
    this.schedulerService.isRunning().subscribe(res => {
      this.isRunning = res['is-running'];
      if (this.isRunning) {
        this.schedulerState = 'Stop scheduler';
        this.schedulerService.nextDue().subscribe(res => {
          this.nextDue = res.next;
        });
    } else {
        this.schedulerState = 'Start scheduler';
      }
    });
  }

  isRunningChanged(e: MatSlideToggleChange) {
    if (e.checked) {
      this.schedulerService.turnOn().subscribe(res => {
        if (res.result === 'OK') {
          this.schedulerState = 'Stop scheduler';
          this.showHttpSuccess('Scheduler was successfully started');
          this.schedulerService.nextDue().subscribe(res => {
            this.nextDue = res.next;
            this.isRunning = true;
          });
        } else {
          this.showHttpError(res.status);
        }
      });
    } else {
      this.schedulerService.turnOff().subscribe(res => {
        this.schedulerState = 'Start scheduler';
        this.isRunning = false;
        this.nextDue = null;
      });
    }
  }

  getTasks() {
    this.schedulerService.listTasks().subscribe(res => {
      this.selectedTask = null;
      this.tasks = res || [];
    });
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

  getFilteredTasks() {
    if (this.filter === null || this.filter === '') {
      return this.tasks;
    }
    return this.tasks.filter(x => x.id.toLowerCase().indexOf(this.filter.toLowerCase()) > -1 ||
      (x.description !== null && x.description !== undefined && x.description.toLowerCase().indexOf(this.filter.toLowerCase()) > -1));
  }

  selectTask(task: any) {
    this.selectedTask = task;
      if (!this.selectedTask.hyperlambda) {
      this.schedulerService.getTask(task.id).subscribe(res => {
        this.selectedTask.hyperlambda = res.hyperlambda;
      });
    }
  }

  getInterval(interval: string) {
    if (interval === 'last-day-of-month') {
      return 'last day of the month';
    }
    if (!isNaN(Number(interval))) {
      switch (Number(interval)) {
        case 1:
          return '1st of every month';
        case 2:
          return '2nd of every month';
        case 3:
          return '3rd of every month';
        default:
            return interval + 'th of each month';
      }
    }
    return interval;
  }

  getDate(due: string) {
    return new Date(due).toLocaleString();
  }

  runTask() {
    this.evaluatorService.evaluate(this.selectedTask.hyperlambda).subscribe(res => {
      this.showHttpSuccess('Task was evaluated successfully');
    });
  }

  updateTask() {
    this.schedulerService.updateTask({
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
        this.schedulerService.deleteTask(el.id).subscribe(res2 => {
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
