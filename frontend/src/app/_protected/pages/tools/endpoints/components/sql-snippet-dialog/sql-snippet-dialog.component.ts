import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../../database/_services/sql.service';

@Component({
  selector: 'app-sql-snippet-dialog',
  templateUrl: './sql-snippet-dialog.component.html',
  styleUrls: ['./sql-snippet-dialog.component.scss']
})
export class SqlSnippetDialogComponent implements OnInit {

  /**
   * Snippet files as returned from backend.
   */
   files: string[] = [];

   /**
    * Filter for filtering files to display.
    */
   filter: string = '';

   /**
    * Creates an instance of your login dialog.
    *
    * @param dialogRef Needed to be able to close dialog as user selects a snippet
    * @param feedbackService Needed to be able to display feedback to user
    * @param sqlService Needed to retrieve snippets from backend
    * @param data Input data, more specifically the database type the user is currently using
    */
   constructor(
     private dialogRef: MatDialogRef<SqlSnippetDialogComponent>,
     private generalService: GeneralService,
     private sqlService: SqlService,
     @Inject(MAT_DIALOG_DATA) public data: string) { }

   /**
    * OnInit implementation.
    */
   ngOnInit() {
     this.sqlService.listSnippets(this.data).subscribe((files: string[]) => {
       this.files = files.filter(x => x.endsWith('.sql'));
     }, (error: any) => this.generalService.showFeedback(error, 'errorMessage'));
   }

   /**
    * Returns only the filename parts from the given full path and filename.
    *
    * @param path Complete path of file
    */
   getFilename(path: string) {
     const result = path.substring(path.lastIndexOf('/') + 1);
     return result.substring(0, result.lastIndexOf('.'));
   }

   /**
    * Invoked when user selects a file.
    */
   select(filename: string) {
     this.dialogRef.close(this.getFilename(filename));
   }

}
