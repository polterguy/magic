
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from 'src/app/services--/feedback.service';
import { Task } from 'src/app/components/management/tasks/models/task.model';
import { TaskService } from 'src/app/_protected/pages/tools/task-scheduler/_services/task.service';

/**
 * Modal dialog used to allow user to schedule a task.
 */
@Component({
  selector: 'app-schedule-task-dialog',
  templateUrl: './schedule-task-dialog.component.html',
  styleUrls: ['./schedule-task-dialog.component.scss']
})
export class ScheduleTaskDialogComponent {

  /**
   * Current date to use for specifying minimum starting date.
   */
  currentDate: Date = null;

  /**
   * Date user selects, if he selects an explicit due date.
   */
  date: Date = null;

  /**
   * If true, user wants to provide a repeating pattern, and not an explicit due date.
   */
  isRepeating = false;

  /**
   * Repetition pattern user selects.
   */
  repeats: string = null;

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param feedbackService Needed to be able to display feedback to user
   * @param taskService Needed to be able to create our task
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<ScheduleTaskDialogComponent>,
    private feedbackService: FeedbackService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: Task) {
    this.currentDate = new Date();
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  create() {
    const date = this.isRepeating ? null : this.date;
    const repeating = this.isRepeating ? this.repeats : null;
    this.taskService.schedule(this.data.id, date, repeating).subscribe({
      next: () => this.dialogRef.close(this.data),
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
