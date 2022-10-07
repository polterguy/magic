
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { CacheService } from 'src/app/services/cache.service';
import { MessageService } from '../../../../services/common/message.service';
import { BackendService } from '../../../../services/common/backend.service';
import { SqlService } from '../../../sql-studio/_services/sql.service';
import { LogService } from 'src/app/_protected/pages/log/_services/log.service';
import { Crudify } from 'src/app/_protected/pages/crud-generator/_models/crudify.model';
import { LocResult } from 'src/app/_protected/pages/crud-generator/_models/loc-result.model';
import { DefaultDatabaseType } from '../../../sql-studio/_models/default-database-type.model';
import { CrudifyService } from 'src/app/_protected/pages/crud-generator/_services/crudify.service';

// CodeMirror options.
import json from '../../../../../codemirror/options/json.json'

// Default configuration for crudifying database.
import data from './data/data.json';
import { GeneralService } from 'src/app/_general/services/general.service';

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
  cmOptions = {
    json: json,
  };

  /**
   * Database type we're using, e.g. 'mysql', 'pgsql', 'sqlite' or 'mssql'.
   */
  databaseType: string = null;

  /**
   * Data for CodeMirror instance to show crudify input to user,
   * allowing him to edit it if he wants to.
   */
  crudifyContent: string = null;

  /**
   * Creates an instance of your component.
   *
   * @param logService Needed to log LOC to backend
   * @param sqlService Needed to retrieve default database type
   * @param backendService Needed to re-retrieve endpoints after crudification is done
   * @param cacheService Needed to clear endpoints cache after crudifying Magic database
   * @param crudifyService Needed to crudify Magic database.
   * @param feedbackService Needed to display feedback to user
   * @param messageService Message service used to publish messages informing parent component about change of state
   */
  constructor(
    private logService: LogService,
    private sqlService: SqlService,
    private backendService: BackendService,
    private cacheService: CacheService,
    private crudifyService: CrudifyService,
    private generalService: GeneralService,
    protected messageService: MessageService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.sqlService.defaultDatabaseType().subscribe({
      next: (res: DefaultDatabaseType) => {
        this.databaseType = res.default;
        this.crudifyContent = JSON.stringify(data, null, 2);
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)});
  }

  /**
   * Invoked when user clicks the next button.
   */
  next() {
    const endpoints = <Crudify[]>JSON.parse(this.crudifyContent);
    const forks = endpoints.map(x => this.crudifyService.crudify(x));
    forkJoin(forks).subscribe({
      next: (res: LocResult[]) => {
        const loc = res.reduce((x,y) => x + y.loc, 0);
        this.generalService.showFeedback(`Your Magic database was successfully crudified. ${loc} LOC generated.`);
        this.logService.createLocItem(loc, 'backend', 'setup').subscribe({
          next: () => {
            this.cacheService.delete('magic.auth.endpoints').subscribe({
              next: () => {
                this.backendService.refetchEndpoints();
                this.backendService.active.status.magic_crudified = true;
              },
              error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)});
          },
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)});
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)});
  }
}
