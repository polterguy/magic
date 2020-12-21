
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Task } from 'src/app/models/task.model';
import { BaseComponent } from '../base.component';
import { TaskService } from 'src/app/services/task.service';
import { MessageService } from 'src/app/services/message.service';

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

  // List of task names that we're currently viewing details for.
  private displayDetails: string[] = [];

  /**
   * Visible columns in data table.
   */
  public displayedColumns: string[] = [
    'id',
    'created',
  ];

  /**
   * Tasks that are currently being viewed.
   */
  public tasks: Task[] = null;

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

      // Assigning return value to currently viewed items.
      this.tasks = tasks || [];
    });
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
   * Returns true if details for specified task should be displayed.
   * 
   * @param el Task to display details for
   */
  public shouldDisplayDetails(el: Task) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === el.id).length > 0;
  }

  /**
   * Toggles details about one specific task.
   * 
   * @param el Task to toggle details for
   */
  public toggleDetails(el: Task) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(el.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(el.id);
    }
  }
}
