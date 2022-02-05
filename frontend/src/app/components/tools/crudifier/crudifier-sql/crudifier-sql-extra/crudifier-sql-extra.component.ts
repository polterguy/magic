
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { CrudifyService } from '../../services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { Argument } from '../../../../analytics/endpoints/models/argument.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Model } from '../../../../codemirror/codemirror-sql/codemirror-sql.component';
import { CrudifierSqlAddArgumentDialogComponent } from './crudifier-sql-add-argument-dialog/crudifier-sql-add-argument-dialog.component';

/**
 * Component allowing user to generate an SQL based endpoint.
 */
@Component({
  selector: 'app-crudifier-sql-extra',
  templateUrl: './crudifier-sql-extra.component.html',
  styleUrls: ['./crudifier-sql-extra.component.scss']
})
export class CrudifierSqlExtraComponent implements OnInit {

  /**
   * Verbs user can select from.
   */
  public verbs: string[] = [
    'post',
    'get',
    'put',
    'delete',
    'patch',
  ];

  /**
   * Currently selected verb.
   */
  public verb: string;

  /**
   * Module name that becomes its second last relative URL.
   */
  public moduleName: string;

  /**
   * Endpoint name that becomes its very last relative URL.
   */
  public endpointName = '';

  /**
   * Comma separated list of roles allowed to invoke endpoint.
   */
  public authorization = 'root, admin';

  /**
   * Whether or not endpoint returns a list of items or a single item.
   */
  public isScalar = false;

  /**
   * Whether or not existing endpoints should be overwritten or not.
   */
  public overwrite = false;

  /**
   * List of arguments endpoint can handle.
   */
  public arguments: Argument[] = [];

  /**
   * Input SQL component model and options.
   */
  public input: Model = null;

  /**
   * Missing variable to be identified -- used in the html file
   */
  public isList;

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
  public ngOnInit() {

    // Defaulting verb to GET.
    this.verb = this.verbs.filter(x => x === 'get')[0];

    // Turning off auto focus.
    this.input.options.autofocus = false;

    // Defaulting primary URL to database name.
    this.moduleName = this.input.database;
    this.endpointName = 'custom-sql';
  }

  /**
   * Returns true if endpoint name and module name is valid.
   */
  public validModuleComponentName() {
    return /^[a-z0-9_-]+$/.test(this.endpointName) && /^[a-z0-9_-]+$/.test(this.moduleName);
  }

  /**
   * Generates your SQL endpoint.
   */
  public generate() {

    // Invoking backend through service instance.
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

        // Providing feedback to user.
        this.feedbackService.showInfo('SQL endpoint successfully created');

        // Publishing message to subscribers that '/modules/' folder changed.
        this.messageService.sendMessage({
          name: 'magic.folders.update',
          content: '/modules/'
        });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to add an argument to argument declaration of endpoint.
   */
  public addArgument() {

    // Creating modal dialogue that asks user what name and type he wants to use for his argument.
    const dialogRef = this.dialog.open(CrudifierSqlAddArgumentDialogComponent, {
      width: '350px',
    });

    dialogRef.afterClosed().subscribe((argument: Argument) => {

      // Checking if modal dialog wants to jail the user.
      if (argument) {

        // Checking if argument already exists.
        if (this.arguments.filter(x => x.name === argument.name).length > 0) {

          // Oops, argument already declared.
          this.feedbackService.showError('Argument already exists');
          return;
        }

        // Adding argument to argument declaration.
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
  public removeArgument(argument: Argument) {

    // Removing argument from collection.
    this.arguments.splice(this.arguments.indexOf(argument), 1);
  }

  /*
   * Private helper methods.
   */

  /**
   * Returns the string (Hyperlambda) representation of declared arguments.
   */
  private getArguments() {

    // Transforming list of arguments to Hyperlambda declaration.
    return this.arguments.map(x => x.name + ':' + x.type).join('\r\n');
  }
}
