
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { TaskService } from './_services/task.service';
import { Task } from './_models/task.model';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Count } from 'src/app/_protected/models/common/count.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { ScheduleTaskComponent } from './components/schedule-task/schedule-task.component';
import { ManageTaskComponent } from './components/manage-task/manage-task.component';
import { Schedule } from './_models/schedule.model';
import { PageEvent } from '@angular/material/paginator';

class TaskEx {
  task: Task;
  model?: Model;
}

/**
 * Helper component to administrate Hyperlambda tasks.
 */
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  tasks: TaskEx[] = [];
  displayedColumns: string[] = ['name', 'description', 'duration', 'created', 'actions'];
  dataSource: any = [];
  pageIndex: number = 0;
  pageSize: number = 13;
  totalItems: number = 0;
  isLoading: boolean = true;
  searchText: string = '';

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.getTasks();
    this.getCount();
  }

  addTask() {

    this.dialog.open(ManageTaskComponent, {
      width: '800px',
      panelClass: ['light'],
      disableClose: true,
    }).afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getTasks();
        this.getCount();
      }
    })
  }

  editTask(task: any) {

    this.dialog.open(ManageTaskComponent, {
      width: '800px',
      panelClass: ['light'],
      data: task
    }).afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getTasks();
        this.getCount();
      }
    })
  }

  execute(task: any) {

    this.taskService.execute(task.id).subscribe({
      next: () => this.generalService.showFeedback('Task successfully executed', 'successMessage'),
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
    });
  }

  deleteTask(task: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${task.id} task`,
        description_extra: `You are deleting the selected task. Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.taskService.delete(task.id).subscribe({
          next: () => {
            this.generalService.showFeedback('Task successfully deleted', 'successMessage');
            this.getTasks();
            this.getCount();
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
      }
    });
  }

  schedule(task: any) {

    this.dialog.open(ScheduleTaskComponent, {
      width: '800px',
      data: task,
      autoFocus: false
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.getTasks();
      }
    });
  }

  deleteSchedule(schedule: Schedule, task: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete schedule for ${task.id} task`,
        description_extra: `You are deleting the selected schedule for this task. Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.taskService.deleteSchedule(schedule.id).subscribe({
          next: () => {
            task.schedules.splice(task.schedules.indexOf(schedule), 1);
            this.generalService.showFeedback('Schedule deleted successfully', 'successMessage');
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
      }
    })
  }

  changePage(e: PageEvent) {

    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getTasks();
  }

  filterList(event: { searchKey: string }) {

    this.searchText = event.searchKey;
    this.getTasks();
    this.getCount();
  }

  /*
   * Private helper methods
   */

  private getTasks() {

    this.taskService.list(
      this.searchText,
      this.pageIndex * this.pageSize,
      this.pageSize).subscribe({
        next: (tasks: Task[]) => {
          if (tasks) {
            tasks.forEach((item: any) => this.getDetails(item))
          }
          this.dataSource = tasks || [];
          this.isLoading = false;
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
  }

  private getCount() {

    this.taskService.count(this.searchText).subscribe({
      next: (count: Count) => this.totalItems = count.count,
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private getDetails(item: any) {

    this.taskService.get(item.id).subscribe({
      next: (task: Task) => {
        item.hyperlambda = task.hyperlambda;
        if (task.schedules) {
          item.schedules = task.schedules.map(x => {
            return {
              id: x.id,
              due: new Date(x.due),
              repeats: x.repeats,
            };
          });
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }
}
