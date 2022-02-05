
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Endpoint } from 'src/app/models/endpoint.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LogService } from 'src/app/components/analytics/diagnostics-log/services/log.service';
import { UserService } from 'src/app/components/management/auth/services/user.service';
import { RoleService } from 'src/app/components/management/auth/services/role.service';
import { AuthService } from 'src/app/components/management/auth/services/auth.service';
import { TaskService } from 'src/app/components/tools/tasks/services/task.service';
import { DiagnosticsService } from 'src/app/components/diagnostics/services/diagnostics.service';

/**
 * Component that allows user to view diagnostics information
 * about his installation specific.
 */
@Component({
  selector: 'app-diagnostics-overview',
  templateUrl: './diagnostics-overview.component.html',
  styleUrls: ['./diagnostics-overview.component.scss']
})
export class DiagnosticsOverviewComponent implements OnInit {

  /**
   * Number of users in installation.
   */
  public userCount: number = -1;

  /**
   * Number of roles in installation.
   */
  public roleCount: number = -1;

  /**
   * Number of log items in installation.
   */
  public logCount: number = -1;

  /**
   * Total count of tasks in system
   */
  public taskCount: number = -1;

  /**
   * Total number of endpoints in the system.
   */
  public endpoints: number = -1;

  /**
   * Backend version as returned from server.
   */
  public version: string;

  /**
   * Creates an instance of your component.
   * 
   * @param logService Needed to retrieve LOC statistics
   * @param userService Needed to count users in installation
   * @param roleService Needed to count roles in system
   * @param taskService Needed to count tasks in installation
   * @param authService Needed to retrieve number of endpoints in installation
   * @param diagnosticsService Needed to retrieve health data from backend
   * @param feedbackService Needed to display errors to user if errors occurs
   */
  constructor(
    private logService: LogService,
    private userService: UserService,
    private roleService: RoleService,
    private taskService: TaskService,
    private authService: AuthService,
    private diagnosticsService: DiagnosticsService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {
    
    // Counting users in installation.
    this.userService.count().subscribe((count: Count) => {
      this.userCount = count.count;
    }, (error: any) => this.feedbackService.showError(error));

    // Counting roles in installation.
    this.roleService.count().subscribe((count: Count) => {
      this.roleCount = count.count;
    }, (error: any) => this.feedbackService.showError(error));

    // Counting log items in installation.
    this.logService.count().subscribe((count: Count) => {
      this.logCount = count.count;
    }, (error: any) => this.feedbackService.showError(error));

    // Counting tasks in system.
    this.taskService.count().subscribe((count: Count) => {
      this.taskCount = count.count;
    });

    // Counting endpoints in system.
    this.authService.getEndpoints().subscribe((endpoints: Endpoint[]) => {
      this.endpoints = endpoints.length;
    });

    this.diagnosticsService.version().subscribe((version: any) => {
      this.version = version.version;
    });
  }
}
