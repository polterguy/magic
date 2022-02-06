
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Task } from 'src/app/components/tools/tasks/models/task.model';
import { TaskService } from 'src/app/components/tools/tasks/services/task.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-schedule-task-dialog',
  templateUrl: './schedule-task-dialog.component.html',
  styleUrls: ['./schedule-task-dialog.component.scss']
})
export class ScheduleTaskDialogComponent {

  /**
   * Date user selects, if he selects an explicit due date.
   */
  public date: Date = null;

  /**
   * If true, user wants to provide a repeating pattern, and not an explicit due date.
   */
  public isRepeating = false;

  /**
   * Repetition pattern user selects.
   */
  public repeats: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param taskService Needed to be able to create our task
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<ScheduleTaskDialogComponent>,
    private feedbackService: FeedbackService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: Task) { }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  public create() {

    // Figuring out what type of task user wants to create.
    const date = this.isRepeating ? null : this.date;
    const repeating = this.isRepeating ? this.repeats : null;

    // Invoking backend to create a new schedule for task.
    this.taskService.schedule(this.data.id, date, repeating).subscribe(() => {

      // Success! Closing dialog and giving caller the new task, now with an additional schedule declared in it.
      this.dialogRef.close(this.data);

    }, (error: any) => this.feedbackService.showError(error));
  }
}
