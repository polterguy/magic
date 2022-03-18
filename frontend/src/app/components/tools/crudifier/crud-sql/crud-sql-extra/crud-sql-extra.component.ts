
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { CrudifyService } from '../../services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Argument } from '../../../../analytics/endpoints/models/argument.model';
import { Model } from '../../../../codemirror/codemirror-sql/codemirror-sql.component';
import { CrudSqlAddArgumentDialogComponent } from './crud-sql-add-argument-dialog/crud-sql-add-argument-dialog.component';

/**
 * Component allowing user to generate an SQL based endpoint.
 */
@Component({
  selector: 'app-crud-sql-extra',
  templateUrl: './crud-sql-extra.component.html'
})
export class CrudSqlExtraComponent implements OnInit {

  /**
   * Verbs user can select from.
   */
  verbs: string[] = [
    'post',
    'get',
    'put',
    'delete',
    'patch',
  ];

  /**
   * Currently selected verb.
   */
  verb: string;

  /**
   * Module name that becomes its second last relative URL.
   */
  moduleName: string;

  /**
   * Endpoint name that becomes its very last relative URL.
   */
  endpointName = '';

  /**
   * Comma separated list of roles allowed to invoke endpoint.
   */
  authorization = 'root, admin';

  /**
   * Whether or not endpoint returns a list of items or a single item.
   */
  isScalar = false;

  /**
   * Whether or not existing endpoints should be overwritten or not.
   */
  overwrite = false;

  /**
   * List of arguments endpoint can handle.
   */
  arguments: Argument[] = [];

  /**
   * Input SQL component model and options.
   */
  input: Model = null;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to show user feedback
   * @param crudifyService Needed to crudify endpoint
   * @param messageServive Needed to publish messages to other components
   * @param dialog Needed to show modal dialog to user allowing him to add a new argument to argument collection of endpoint
   */
  constructor(
    private feedbackService: FeedbackService,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.verb = this.verbs.filter(x => x === 'get')[0];
    this.input.options.autofocus = false;
    this.moduleName = this.input.database;
    this.endpointName = 'custom-sql';
  }

  /**
   * Returns true if endpoint name and module name is valid.
   */
  validModuleComponentName() {
    return /^[a-z0-9_-]+$/.test(this.endpointName) && /^[a-z0-9_-]+$/.test(this.moduleName);
  }

  /**
   * Generates your SQL endpoint.
   */
  generate() {
    this.crudifyService.generateSqlEndpoint({
      databaseType: this.input.databaseType,
      database: this.input.database,
      authorization: this.authorization,
      moduleName: this.moduleName,
      endpointName: this.endpointName,
      verb: this.verb,
      sql: this.input.sql,
      arguments: this.getArguments(),
      overwrite: this.overwrite,
      isList: !this.isScalar}).subscribe(() => {
        this.feedbackService.showInfo('SQL endpoint successfully created');
        this.messageService.sendMessage({
          name: 'magic.folders.update',
          content: '/modules/'
        });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to add an argument to argument declaration of endpoint.
   */
  addArgument() {
    const dialogRef = this.dialog.open(CrudSqlAddArgumentDialogComponent, {
      width: '350px',
    });
    dialogRef.afterClosed().subscribe((argument: Argument) => {
      if (argument) {
        if (this.arguments.filter(x => x.name === argument.name).length > 0) {
          this.feedbackService.showError('Argument already exists');
          return;
        }
        this.arguments.push(argument);
      }
    });
  }

  /**
   * Invoked when user wants to remove an argument from collection of arguments
   * endpoint can handle.
   * 
   * @param argument Argument to remove
   */
  removeArgument(argument: Argument) {
    this.arguments.splice(this.arguments.indexOf(argument), 1);
  }

  /*
   * Private helper methods.
   */

  /**
   * Returns the string (Hyperlambda) representation of declared arguments.
   */
  private getArguments() {
    return this.arguments.map(x => x.name + ':' + x.type).join('\r\n');
  }
}
