
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Task } from './models/task.model';
import { Schedule } from './models/schedule.model';
import { Count } from 'src/app/models/count.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from '../../../services/feedback.service';
import { TaskService } from 'src/app/components/tools/tasks/services/task.service';
import { NewTaskDialogComponent } from './new-task-dialog/new-task-dialog.component';
import { ScheduleTaskDialogComponent } from './schedule-task-dialog/schedule-task-dialog.component';
import { Model } from '../../utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../utilities/confirm/confirm-dialog.component';

// CodeMirror options.
import hyperlambda from '../../utilities/codemirror/options/hyperlambda.json';

/*
 * Helper class to encapsulate a task and its details,
 * in addition to its CodeMirror options and model.
 */
class TaskEx {

  // Actual task as returned from backend.
  task: Task;

  // CodeMirror model for editing task's details.
  model?: Model;
}

/**
 * Tasks component allowing you to administrate tasks, both scheduled tasks
 * and non-scheduled tasks.
 */
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class TasksComponent implements OnInit {

  /**
   * Tasks that are currently being viewed.
   */
  tasks: TaskEx[] = null;
  expandedElement: any;

  /**
   * Visible columns in data table.
   */
  displayedColumns: string[] = [
    'id',
    'delete',
  ];

  /**
   * Number of tasks in backend currently matching our filter.
   */
  count: number = 0;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Filter form control for filtering tasks to display.
   */
  filterFormControl: FormControl;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display feedback to user
   * @param taskService Needed to retrieve, update, delete and modify tasks in our backend
   * @param backendService Needed to be able to determine user's access rights in backend
   * @param dialog Needed to create modal dialogues
   */
  constructor(
    private feedbackService: FeedbackService,
    private taskService: TaskService,
    public backendService: BackendService,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getTasks();
      });
    this.getTasks();
  }

  /**
   * Retrieves tasks from your backend and re-databinds UI.
   */
  getTasks() {
    this.taskService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe({
        next: (tasks: Task[]) => {
          this.tasks = (tasks || []).map(idx => {
            return {
              task: idx
            }
          });
          this.taskService.count(this.filterFormControl.value).subscribe({
            next: (count: Count) => this.count = count.count,
            error: (error: any) => this.feedbackService.showError(error)});
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Clears the current filter.
   */
  clearFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getTasks();
  }

  /**
   * Toggles details about one specific task.
   * 
   * @param el Task to toggle details for
   */
  toggleDetails(el: TaskEx) {
    if (!el.model) {
      this.taskService.get(el.task.id).subscribe({
        next: (task: Task) => {
          el.task.hyperlambda = task.hyperlambda;
          if (task.schedules) {
            el.task.schedules = task.schedules.map(x => {
              return {
                id: x.id,
                due: new Date(x.due),
                repeats: x.repeats,
              };
            });
          }
          setTimeout(() => {
            el.model = {
              hyperlambda: task.hyperlambda,
              options: hyperlambda
            };
          }, 200);
          setTimeout(() => {
            var domNode = (<any>document.querySelector('.CodeMirror'));
            var editor = domNode.CodeMirror;
            editor.doc.markClean();
            editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
          }, 500);
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Invoked when user wants to save a task.
   * 
   * @param task Task caller wants to save
   */
  update(task: TaskEx) {
    this.taskService.update(
      task.task.id,
      task.model.hyperlambda,
      task.task.description).subscribe({
        next: () => this.feedbackService.showInfoShort('Task successfully saved'),
        error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to execute a task.
   * 
   * @param task Task caller wants to save
   */
   execute(task: TaskEx) {
    this.taskService.execute(task.task.id).subscribe({
      next: () => this.feedbackService.showInfoShort('Task successfully executed'),
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to create a new task.
   */
  create() {
    const dialogRef = this.dialog.open(NewTaskDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((name: string) => {
      if (name) {
        this.feedbackService.showInfo(`'${name}' task successfully created`);
        this.filterFormControl.setValue(name);
      }
    });
  }

  /**
   * Deletes a task in your backend.
   * 
   * @param event Click event, needed to stop propagation
   * @param task Task to delete
   */
  delete(event: any, task: TaskEx) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        text: `Are you sure you want to delete the '${task.task.id}' task?`,
        title: 'Please confirm delete operation'
      }
    });
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {
      if (result && result.confirmed) {
        this.taskService.delete(task.task.id).subscribe({
          next: () => {
            this.feedbackService.showInfoShort('Task successfully deleted');
            this.getTasks();
          },
          error: (error: any)=> this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Schedules task for execution in the future.
   * 
   * @param task Task user wants to schedule
   */
  schedule(task: Task) {
    const dialogRef = this.dialog.open(ScheduleTaskDialogComponent, {
      width: '350px',
      data: task
    });
    dialogRef.afterClosed().subscribe((result: Task) => {
      if (result) {
        this.feedbackService.showInfo('Task was successfully scheduled');
        this.taskService.get(task.id).subscribe({
          next: (nTask: Task) => task.schedules = nTask.schedules,
          error: (error: any) =>this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when user wants to delete a schedule for a task.
   * 
   * @param task Task that contains schedule
   * @param schedule Schedule to remove from task
   */
  deleteSchedule(task: Task, schedule: Schedule) {
    this.feedbackService.confirm(
      'Please confirm delete operation',
      'Are you sure you want to delete the schedule for the task?',
      () => {
        this.taskService.deleteSchedule(schedule.id).subscribe({
          next: () => {
            task.schedules.splice(task.schedules.indexOf(schedule), 1);
            this.feedbackService.showInfoShort('Schedule deleted');
          },
          error: (error: any) =>this.feedbackService.showError(error)});
    });
  }
}
