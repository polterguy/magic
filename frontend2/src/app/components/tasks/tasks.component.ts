
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Count } from 'src/app/models/count.model';
import { MatDialog } from '@angular/material/dialog';
import { Schedule, Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/services/task.service';
import { MessageService } from 'src/app/services/message.service';
import { NewTaskDialogComponent } from './new-task-dialog/new-task-dialog.component';
import { Model } from '../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm/confirm-dialog.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json';

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
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent extends BaseComponent implements OnInit {

  /**
   * Tasks that are currently being viewed.
   */
  public tasks: TaskEx[] = null;

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
   * @param messageService Needed to send and subscribe to messages sent to and from other components
   */
  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    protected messageService: MessageService) {
    super(messageService);
  }

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

      // Checking if only one task was returned, and if so, we automatically set it into edit mode.
      if (this.tasks.length === 1 && this.paginator.pageIndex === 0) {

        // Invoking backend to get tasks details.
        this.toggleDetails(this.tasks[0]);
      }

      // Retrieving count of items from backend.
      this.taskService.count(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning count to returned value from server.
        this.count = count.count;

      }, (error: any) => this.showError(error));
    }, (error: any) => this.showError(error));
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
    if (el.model) {

      // Hiding item.
      el.model = null;

    } else {

      // Retrieving task from backend.
      this.taskService.get(el.task.id).subscribe((task: Task) => {

        // Adding task to list of currently viewed items.
        const hyp = hyperlambda;
        hyp.extraKeys['Alt-M'] = (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        };

        // Making sure we add additional fields returned from server for completeness sake.
        el.task.hyperlambda = task.hyperlambda;
        el.task.schedule = task.schedule.map(x => {
          return {
            id: x.id,
            due: new Date(x.due),
            repeats: x.repeats,
          };
        });

        // By adding these fields to instance, task will be edited in UI.
        el.model = {
          hyperlambda: task.hyperlambda,
          options: hyp
        }
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
      this.showInfoShort('Task successfully updated');
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
        this.showInfo(`'${name}' task successfully created`);
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
          this.showInfoShort('Task successfully deleted');
          this.getTasks();
        }, (error: any)=> this.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to delete a schedule for a task.
   * 
   * @param schedule Schedule to remove from task
   */
  public removeSchedule(schedule: Schedule) {
    console.log(schedule);
  }
}
