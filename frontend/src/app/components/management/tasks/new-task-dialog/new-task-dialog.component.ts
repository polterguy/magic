
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';
import { TaskService } from 'src/app/_protected/pages/tools/task-scheduler/_services/task.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-new-task-dialog',
  templateUrl: './new-task-dialog.component.html'
})
export class NewTaskDialogComponent {

  /**
   * Name of new task to create.
   */
  name = '';

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param feedbackService Needed to be able to display feedback to user
   * @param taskService Needed to be able to create our task
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<NewTaskDialogComponent>,
    private feedbackService: FeedbackService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: string) {
    if (this.data) {
      this.name = data;
    }
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  create() {
    if (!this.argumentValid()) {
      return;
    }
    this.taskService.create(this.name, 'log.info:Hello world from task').subscribe({
      next: () => this.dialogRef.close(this.name),
      error:(error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns true if argument name is valid.
   */
   public argumentValid() {
    return /^[_a-z][a-z0-9_.-]*$/.test(this.name);
  }
}
