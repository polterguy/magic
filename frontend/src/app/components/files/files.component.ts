
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '../../services/file-service';
import { EvaluatorService } from '../../services/evaluator-service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SqlService } from 'src/app/services/sql-service';
import { NewFileDialogComponent } from './modals/new-file-dialog';
import { ConfirmDeletionDialogComponent } from './modals/confirm-deletion-dialog';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {

  private dataSource: any[] = [];
  private displayedColumns: string[] = ['path', 'download', 'delete'];
  private displayedSecondRowColumns: string[] = ['details'];
  private path = '/';
  private databaseTypes = ['mysql', 'mssql'];
  private selectedDatabaseType = 'mysql';
  private filter = '';
  private safeMode = true;
  private protectedFolders: string[] = [
    '/misc/',
    '/misc/mssql/',
    '/misc/mssql/templates/',
    '/misc/mysql/',
    '/misc/mysql/templates/',
    '/misc/templates/',
    '/misc/templates/angular/',
    '/misc/templates/angular-component/',
    '/modules/',
    '/modules/system/',
    '/modules/system/*',
    '/trash/',
  ];
  private protectedFiles: string[] = [
    '/misc/README.md',
    '/misc/templates/README.md',
    '/misc/mssql/create-user.hl',
    '/misc/mssql/magic_auth.sql',
    '/misc/mssql/magic.authenticate.hl',
    '/misc/mysql/create-user.hl',
    '/misc/mysql/magic_auth.sql',
    '/misc/mysql/magic.authenticate.hl',
    '/misc/mysql/magic_crm.sql',
    '/modules/README.md',
    '/modules/system/*',
  ];

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
    this.fileService.listFiles(this.path).subscribe(files => {
      this.fileService.listFolders(this.path).subscribe(folders => {
        this.dataSource = (folders || []).concat(files || []).map(x => {
          return {
            path: x,
            extra: null,
          };
        });
        console.log(this.dataSource);
      });
    });
  }

  downloadFile(path: string) {
    this.fileService.downloadFile(path);
  }

  deletePath(el: any) {
    const dialogRef = this.dialog.open(ConfirmDeletionDialogComponent, {
      width: '500px',
      data: {
        file: el.path
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (el.path.endsWith('/')) {
          this.fileService.deleteFolder(el.path).subscribe(res2 => {
            this.showInfo('Folder was successfully deleted');
            this.getPath();
          });
        } else {
          this.fileService.deleteFile(el.path).subscribe(res2 => {
            this.showInfo('File was successfully deleted');
            el.extra = null;
            this.getPath();
          });
        }
      }
    });
  }

  getFileName(el: string) {
    if (el.endsWith('/')) {
      const result = el.substr(0, el.length - 1);
      return result.substr(result.lastIndexOf('/') + 1);
    }
    return el.substr(el.lastIndexOf('/') + 1);
  }

  selectPath(el: any) {
    if (el.path.endsWith('/')) {
      this.path = el.path;
      this.getPath();
    } else {
      const mode = this.getMode(el);
      if (mode == null) {
        this.showError('No editor registered for file. Download and edit locally.');
      } else {
        this.openFile(el);
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

    dialogRef.afterClosed().subscribe(res => {
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
    } else if (filename.indexOf('.') === -1) {
      this.showError('Your file needs an extension, such as ".hl" or something');
    } else {
      this.fileService.saveFile(this.path + filename, '/* Initial content */').subscribe((res) => {
        this.showInfo('File successfully created');
        this.getPath();
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

  upOneFolder() {
    const splits = this.path.split('/');
    splits.splice(-2, 1);
    this.path = splits.join('/');
    this.getPath();
    this.filter = '';
    return false;
  }

  openFile(el: any) {
    console.log(el);
    this.fileService.getFileContent(el.path).subscribe(res => {
      el.extra = {
        fileContent: res,
      };
      console.log(el);
    }, error => {
      this.showError(error.error.message);
    });
  }

  getCodeMirrorOptions(el: any) {
    const result = {
      lineNumbers: true,
      theme: 'material',
      mode: this.getMode(el),
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
      }
    };
    if (this.getMode(el) === 'hyperlambda') {
      result.extraKeys['Ctrl-Space'] = 'autocomplete';
    }
    return result;
  }

  getMode(el: any) {
    console.log(el);
    const fileEnding = el.path.substr(el.path.lastIndexOf('.') + 1);
    switch (fileEnding) {
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

  evaluate(el: any) {
    this.evaluateService.evaluate(el.extra.fileContent).subscribe(res => {
      this.showInfo('File successfully evaluated');
    }, (error) => {
      this.showError(error.error.message);
    });
    return false;
  }

  evaluateSql(el: any) {
    this.sqlService.evaluate(el.extra.fileContent, this.selectedDatabaseType).subscribe((res) => {
      this.showInfo('SQL was successfully evaluate');
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  handleFileInput(files: FileList) {
    for (let idx = 0; idx < files.length; idx++) {
      this.fileService.uploadFile(this.path, files.item(idx)).subscribe(res => {
        this.showInfo('File was successfully uploaded');
        this.getPath();
      });
    }
  }

  save(el: any) {
    this.fileService.saveFile(el.path, el.extra.fileContent).subscribe(res => {
      this.showInfo('File successfully saved');
    }, (error) => {
      this.showError(error.error.message);
    });
    return false;
  }

  close(el: any) {
    el.extra = null;
  }

  canModify(path: string) {
    if (this.safeMode === false) {
      return true;
    }
    return !this.isProtected(path);
  }

  isProtected(path: string) {
    const entities = path.split('/').filter(x => x !== '');
    if (entities.length === 0) {
      return false;
    }
    if (path.endsWith('/')) {

      // Folder
      const isProtected = this.protectedFolders.indexOf(path) !== -1;
      if (isProtected) {
        return true;
      }
      let incremental = '/';
      for (const idx of entities) {
        incremental += idx + '/';
        if (this.protectedFolders.indexOf(incremental + '*') !== -1) {
          return true;
        }
      }
      return false; // No recursively protected folders matching current folder.
    } else {

      // File
      const isProtected = this.protectedFiles.indexOf(path) !== -1;
      if (isProtected) {
        return true;
      }
      let incremental = '/';
      for (const idx of entities) {
        incremental += idx + '/';
        if (this.protectedFiles.indexOf(incremental + '*') !== -1) {
          return true;
        }
      }
      return false; // No recursively protected folders matching current folder.
    }
  }

  isFolder(path: string) {
    return path.endsWith('/');
  }

  getRowClass(el: any) {
    let additionalCss = '';
    if (this.isProtected(el.path)) {
      if (this.safeMode) {
        additionalCss = 'danger ';
      } else {
        additionalCss = 'semi-danger ';
      }
    }
    if (el.extra !== null && el === el.path) {
      return additionalCss + 'selected-file';
    }
    if (el.path.endsWith('/')) {
      return additionalCss + 'folder-row';
    }
    return additionalCss + '';
  }

  getClassForDetails(el: any) {
    if (el.extra === null || el.extra.fileContent === null) {
      return 'invisible';
    }
    return 'editor-visible';
  }

  atRoot() {
    return this.path === '/';
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
