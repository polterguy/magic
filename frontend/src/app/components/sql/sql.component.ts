
import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSelectChange, MatDialog } from '@angular/material';
import { SqlService } from 'src/app/services/sql-service';
import { FileService } from 'src/app/services/file-service';
import { TicketService } from 'src/app/services/ticket-service';
import { GetSaveFilenameDialogComponent } from './modals/get-save-filename';

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent implements OnInit {

  private savedFiles = [];
  private selectedScript: string;
  private result: any = null;
  private databaseTypes = ['mysql', 'mssql', 'mssql-batch'];
  private selectedDatabaseType = 'mysql';
  private sqlText = `/*
 * Type your SQL in here
 */
use some_database;
select * from some_table;`;

  constructor(
    private sqlService: SqlService,
    private fileService: FileService,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.selectedDatabaseType = this.ticketService.getDefaultDatabaseType();
    this.getFiles();
  }

  getFiles() {
    this.sqlService.getSavedFiles(this.selectedDatabaseType).subscribe(res => {
      if (res === null || res.length === 0) {
        this.savedFiles = [];
        return;
      }
      this.savedFiles = res.map(x => x.substr(x.lastIndexOf('/') + 1));
    });
  }

  databaseTypeChanged(e: MatSelectChange) {
    this.getFiles();
  }

  fileChanged(e: MatSelectChange) {
    this.fileService.getFileContent(`/misc/${this.selectedDatabaseType}/templates/${e.value}`).subscribe(res => {
      this.sqlText = res;
      this.selectedScript = null;
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      height: '250px',
      mode: 'text/x-mysql',
    };
  }

  save() {
    const dialogRef = this.dialog.open(GetSaveFilenameDialogComponent, {
      width: '500px',
      data: {
        filename: '',
      }
    });

    dialogRef.afterClosed().subscribe(filename => {
      if (filename !== undefined) {
        if (filename.indexOf('.') === -1) {
          filename = filename + '.sql';
        }
        console.log(filename);
        this.sqlService.saveFile(this.selectedDatabaseType, filename, this.sqlText).subscribe(res => {
          this.showHttpSuccess('File successfully saved');
          this.getFiles();
        });
      }
    });
  }

  evaluate() {
    this.sqlService.evaluate(this.sqlText, this.selectedDatabaseType).subscribe((res) => {
      this.result = res;
      this.showHttpSuccess('SQL executed successfully');
    }, (error) => {
      this.showHttpError(error);
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
