
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '../../services/file-service';
import { EvaluatorService } from '../../services/evaluator-service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SqlService } from 'src/app/services/sql-service';

export interface DialogData {
  filename: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  private displayedColumns: string[] = ['path'];
  private path = '/';
  private folders: string[] = [];
  private files: string[] = [];
  private fileContent: string = null;
  private filePath: string;
  private databaseTypes = ['mysql', 'mssql'];
  private selectedDatabaseType = 'mysql';
  private filter = '';

  constructor(
    private fileService: FileService,
    private evaluateService: EvaluatorService,
    private sqlService: SqlService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.evaluateService.vocabulary().subscribe((res) => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
    });
    this.getPath();
  }

  getPath() {
    this.fileService.listFiles(this.path).subscribe((res) => {
      this.files = res || [];
      if (this.path === '/modules/system/') {
        this.showInfo('These files and folders are protected for your safety!');
      }
    });
    this.fileService.listFolders(this.path).subscribe((res) => {
      this.folders = res || [];
    });
  }

  dataSource() {
    const result = this.folders.concat(this.files);
    if (this.filter === '') {
      return result;
    }
    return result.filter(x => x.indexOf(this.filter) !== -1);
  }

  getRowClass(el: string) {
    let additionalCss = '';
    if (el.startsWith('/modules/system/')) {
      additionalCss = 'danger ';
    }
    if (el === this.filePath) {
      return additionalCss + 'selected-file';
    }
    if (el.endsWith('/')) {
      return additionalCss + 'folder-row';
    }
    return additionalCss + '';
  }

  getFileName(el: string) {
    if (el.endsWith('/')) {
      const result = el.substr(0, el.length - 1);
      return result.substr(result.lastIndexOf('/') + 1);
    }
    return el.substr(el.lastIndexOf('/') + 1);
  }

  selectPath(path: string) {
    if (path.endsWith('/')) {
      this.path = path;
      this.getPath();
    } else {
      const mode = this.getMode(path);
      if (mode == null) {
        this.showError('No editor registered for file');
      } else{
        this.openFile(path);
      }
    }
    this.filter = '';
  }

  createNewFile() {
    const dialogRef = this.dialog.open(NewFileDialogComponent, {
      width: '500px',
      data: {
        path: '',
        header: 'New file'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res !== undefined) {
        this.createFile(res);
      }
    });
  }

  createNewFolder() {
    const dialogRef = this.dialog.open(NewFileDialogComponent, {
      width: '500px',
      data: {
        path: '',
        header: 'New folder'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res !== undefined) {
        this.createFolder(res);
      }
    });
  }

  createFile(filename: string) {
    if (filename === '') {
      this.showError('You have to give your filename a name');
    } else if (filename.indexOf('.') == -1) {
      this.showError('Your file needs an extension, such as ".hl" or something');
    } else {
      this.fileService.saveFile(this.path + filename, '/* Initial content */').subscribe((res) => {
        this.showInfo('File successfully created');
        this.getPath();
        this.filePath = this.path + filename;
        this.openFile(this.filePath);
      }, (error) => {
        this.showError(error.error.message);
      });
    }
  }

  createFolder(foldername: string) {
    if (foldername === '') {
      this.showError('You have to give your folder a name');
    } else {
      const letters = /^[0-9a-z]+$/;
      if (!letters.test(foldername)) {
        this.showError('A Folder can only have the characters [a-z] and [0-1] in its name');
      } else {
        this.fileService.createFolder(this.path + foldername).subscribe((res) => {
          this.showInfo('Folder successfully created');
          this.getPath();
        }, (error) => {
          this.showError(error.error.message);
        });
      }
    }
  }

  deleteFolder() {
    this.fileService.deleteFolder(this.path).subscribe((res) => {
      this.showInfo('Folder successfully deleted');
      let newPath = this.path.substr(1, this.path.length - 2);
      newPath = newPath.substr(0, newPath.lastIndexOf('/'));
      this.path = '/' + newPath + '/';
      this.getPath();
      this.filter = '';
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  upOneFolder() {
    const splits = this.path.split('/');
    splits.splice(-2, 1);
    this.path = splits.join('/');
    this.getPath();
    this.filter = '';
    return false;
  }

  openFile(path: string) {
    this.fileService.getFileContent(path).subscribe((res) => {
      this.fileContent = res;
      this.filePath = path;
    }, (err) => {
      this.showError(err.error.message);
    })
  }

  getCodeMirrorOptions() {
    const result = {
      lineNumbers: true,
      theme: 'material',
      mode: this.getMode(this.filePath),
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
      }
    };
    if (this.getMode(this.filePath) === 'hyperlambda') {
      result.extraKeys['Ctrl-Space'] = 'autocomplete';
    }
    return result;
  }

  getMode(path: string) {
    const fileEnding = path.substr(path.lastIndexOf('.') + 1);
    switch(fileEnding) {
      case 'hl':
        return 'hyperlambda';
      case 'md':
        return 'markdown';
      case 'js':
        return 'jsx';
      case 'css':
        return 'css';
      case 'sql':
        return 'text/x-mysql';
      case 'htm':
      case 'html':
        return 'htmlmixed';
      default:
        return null;
    }
  }

  evaluate() {
    this.evaluateService.evaluate(this.fileContent).subscribe((res) => {
      this.showInfo('File successfully evaluated');
    }, (error) => {
      this.showError(error.error.message);
    });
    return false;
  }

  evaluateSql() {
    this.sqlService.evaluate(this.fileContent, this.selectedDatabaseType).subscribe((res) => {
      this.showInfo('SQL was successfully evaluate');
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  save() {
    this.fileService.saveFile(this.filePath, this.fileContent).subscribe((res) => {
      this.showInfo('File successfully saved');
    }, (error) => {
      this.showError(error.error.message);
    });
    return false;
  }

  delete() {
    this.fileService.deleteFile(this.filePath).subscribe((res) => {
      this.showInfo('File successfully deleted');
      this.filePath = null;
      this.fileContent = null;
      this.getPath();
    }, (error) => {
      this.showError(error.error.message);
    });
    return false;
  }

  close() {
    this.fileContent = null;
    this.filePath = null;
    return false;
  }

  showInfo(info: string) {
    this.snackBar.open(info, 'Close', {
      duration: 2000
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}

@Component({
  selector: 'new-file-dialog',
  templateUrl: 'new-file-dialog.html',
})
export class NewFileDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
