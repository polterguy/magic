
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Task } from './models/task.model';
import { Schedule } from './models/schedule.model';
import { Count } from 'src/app/models/count.model';
import { FeedbackService } from '../../../services/feedback.service';
import { TaskService } from 'src/app/components/tools/tasks/services/task.service';
import { NewTaskDialogComponent } from './new-task-dialog/new-task-dialog.component';
import { Model } from '../../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../confirm/confirm-dialog.component';
import { ScheduleTaskDialogComponent } from './schedule-task-dialog/schedule-task-dialog.component';

// CodeMirror options.
import hyperlambda from '../../codemirror/options/hyperlambda.json';
import { AuthService } from '../../../services/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BackendService } from 'src/app/services/backend.service';

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
  public tasks: TaskEx[] = null;
  public expandedElement: any;
  /**
   * Visible columns in data table.
   */
  public displayedColumns: string[] = [
    'id',
    'delete',
  ];

  /**
   * Number of tasks in backend currently matching our filter.
   */
  public count: number = 0;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Filter form control for filtering tasks to display.
   */
  public filterFormControl: FormControl;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display feedback to user
   * @param taskService Needed to retrieve, update, delete and modify tasks in our backend
   * @param authService Needed to verify user has access to components
   * @param dialog Needed to create modal dialogues
   */
  constructor(
    private feedbackService: FeedbackService,
    private taskService: TaskService,
    public authService: AuthService,
    public backendService: BackendService,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getTasks();
      });

    // Retrieving tasks.
    this.getTasks();
  }

  /**
   * Retrieves tasks from your backend and re-databinds UI.
   */
  public getTasks() {

    // Invoking backend to retrieve tasks.
    this.taskService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((tasks: Task[]) => {

      // Assigning return values to currently viewed items by using our TaskEx class.
      this.tasks = (tasks || []).map(idx => {
        return {
          task: idx
        }
      });

      // Retrieving count of items from backend.
      this.taskService.count(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning count to returned value from server.
        this.count = count.count;

      }, (error: any) => this.feedbackService.showError(error));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getTasks();
  }

  /**
   * Toggles details about one specific task.
   * 
   * @param el Task to toggle details for
   */
  public toggleDetails(el: TaskEx) {

    // Checking if we're already displaying details for current item.
    if (!el.model) {

      // Retrieving task from backend.
      this.taskService.get(el.task.id).subscribe((task: Task) => {

        // Making sure we add additional fields returned from server for completeness sake.
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

        // By adding these fields to instance, task will be edited in UI.
        // setting timeout to prevent blinking when expanding the row
        setTimeout(() => {
          el.model = {
            hyperlambda: task.hyperlambda,
            options: hyperlambda
          }
        }, 200);
      });
    }
  }

  /**
   * Invoked when user wants to save a task.
   * 
   * @param task Task caller wants to save
   */
  public update(task: TaskEx) {

    // Invoking backend to save task.
    this.taskService.update(
      task.task.id,
      task.model.hyperlambda,
      task.task.description).subscribe(() => {

      // Success!
      this.feedbackService.showInfoShort('Task successfully updated');
    });
  }

  /**
   * Invoked when user wants to create a new task.
   */
  public create() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewTaskDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe((name: string) => {

      // Checking if modal dialog wants to create a task.
      if (name) {

        // Task was successfully created.
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
  public delete(event: any, task: TaskEx) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Asking user to confirm deletion of file object.
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        text: `Are you sure you want to delete the '${task.task.id}' task?`,
        title: 'Please confirm delete operation'
      }
    });

    // Subscribing to close such that we can delete user if it's confirmed.
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {

      // Checking if user confirmed that he wants to delete the file object.
      if (result && result.confirmed) {

        // Invoking backend to actually delete task.
        this.taskService.delete(task.task.id).subscribe(() => {

          // Success! Showing user some feedback and re-databinding table.
          this.feedbackService.showInfoShort('Task successfully deleted');
          this.getTasks();
        }, (error: any)=> this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Schedules task for execution in the future.
   * 
   * @param task Allows user to schedule task by showing a modal window allowing him to declare his schedule
   */
  public schedule(task: Task) {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(ScheduleTaskDialogComponent, {
      width: '350px',
      data: task
    });

    dialogRef.afterClosed().subscribe((result: Task) => {

      // Checking if modal dialog wants to create a task.
      if (result) {

        // Task was successfully created.
        this.feedbackService.showInfo('Task was successfully scheduled');

        // Invoking backend to retrieve all schedules, now that they're changed.
        this.taskService.get(task.id).subscribe((nTask: Task) => {
          task.schedules = nTask.schedules;
        });
      }
    });
  }

  /**
   * Invoked when user wants to delete a schedule for a task.
   * 
   * @param task Task that contains schedule
   * @param schedule Schedule to remove from task
   */
  public deleteSchedule(task: Task, schedule: Schedule) {

    // Asking user to confirm deletion of schedule.
    this.feedbackService.confirm(
      'Please confirm delete operation',
      'Are you sure you want to delete the schedule for the task?',
      () => {

        // Invoking backend to delete schedule.
        this.taskService.deleteSchedule(schedule.id).subscribe(() => {

          // No reasons to invoke backend to retrieve items again.
          task.schedules.splice(task.schedules.indexOf(schedule), 1);

          // Giving user some feedback.
          this.feedbackService.showInfoShort('Schedule deleted');
        });
    });
  }
}
