
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { AuthService } from 'src/app/services/auth.service';
import { SqlService } from 'src/app/services/tools/sql.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LogService } from 'src/app/services/analytics/log.service';
import { CacheService } from 'src/app/services/analytics/cache.service';
import { Crudify } from 'src/app/components/tools/crudifier/models/crudify.model';
import { LocResult } from 'src/app/components/tools/crudifier/models/loc-result.model';
import { DefaultDatabaseType } from '../../../../../models/default-database-type.model';
import { CrudifyService } from 'src/app/components/tools/crudifier/services/crudify.service';

// CodeMirror options.
import json from '../../../../codemirror/options/json.json'

// Default configuration for crudifying database.
import data from './data/data.json';

/**
 * Component that helps you crudify your magic database
 * during the setup process of Magic.
 */
@Component({
  selector: 'app-crudify-database',
  templateUrl: './crudify-database.component.html'
})
export class CrudifyDatabaseComponent implements OnInit {

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * Database type we're using, e.g. 'mysql', 'pgsql' or 'mssql'.
   */
  public databaseType: string = null;

  /**
   * Data for CodeMirror instance to show crudify input to user,
   * allowing him to edit it if he wants to.
   */
  public crudifyContent: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param logService Needed to log LOC to backend
   * @param sqlService Needed to retrieve default database type
   * @param authService Needed to re-retrieve endpoints after crudification of Magic database
   * @param cacheService Needed to clear endpoints cache after crudifying Magic database
   * @param crudifyService Needed to crudify Magic database.
   * @param feedbackService Needed to display feedback to user
   * @param messageService Message service used to publish messages informing parent component about change of state
   */
  public constructor(
    private logService: LogService,
    private sqlService: SqlService,
    private authService: AuthService,
    private cacheService: CacheService,
    private crudifyService: CrudifyService,
    private feedbackService: FeedbackService,
    protected messageService: MessageService) {
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Figuring out which database type the backend is using for its Magic database.
    this.sqlService.defaultDatabaseType().subscribe((res: DefaultDatabaseType) => {

      // Setting the database type.
      this.databaseType = res.default;

      // Parsing data JSON file to display in CodeMirror editor, and figuring out how many endpoints we'll need to crudify.
      this.crudifyContent = JSON.stringify(data, null, 2);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the next button.
   */
  public next() {

    // Parsing JSON to use as input for HTTP invocation to backend.
    const endpoints = <Crudify[]>JSON.parse(this.crudifyContent);

    // Creating an array of observables.
    const forks = endpoints.map(x => this.crudifyService.crudify(x));

    // Awaiting all observables.
    forkJoin(forks).subscribe((res: LocResult[]) => {

      // Finished, showing some information to user.
      const loc = res.reduce((x,y) => x + y.loc, 0);
      this.feedbackService.showInfo(`Your Magic database was successfully crudified. ${loc} LOC generated.`);

      // Logging to backend number of lines of code generated during cudification.
      this.logService.createLocItem(loc, 'backend', 'setup').subscribe(() => {

        // Success.
        this.cacheService.delete('magic.auth.endpoints').subscribe(() => {

          // Providing feedback over the console.
          console.log('Server side cache cleared');

          this.authService.getEndpoints().subscribe(() => {

            // Providing feedback to the console.
            console.log('Endpoints fetched again from backend');
          });

        }, (error: any) => this.feedbackService.showError(error));

      }, (error: any) => this.feedbackService.showError(error));

      // Publishing message to inform parent component that we're done here.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
