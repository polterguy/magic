
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '../../services/file-service';
import { EvaluatorService } from '../../services/evaluator-service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  private path: string = '/';
  private folders: string[] = [];
  private files: string[] = [];
  private fileContent: string = null;
  private filePath: string;

  constructor(
    private fileService: FileService,
    private evaluateService: EvaluatorService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getPath();
  }

  getPath() {
    this.fileService.listFiles(this.path).subscribe((res) => {
      this.files = res;
    });
    this.fileService.listFolders(this.path).subscribe((res) => {
      this.folders = res;
    });
  }

  dataSource() {
    let result = this.folders.concat(this.files);
    return result;
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
  }

  createNewFile() {
    const dialogRef = this.dialog.open(NewFileDialog, {
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
    return false;
  }

  createNewFolder() {
    const dialogRef = this.dialog.open(NewFileDialog, {
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
    return false;
  }

  createFile(filename: string) {
    if (filename == '') {
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
    if (foldername == '') {
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
      let items = this.path.split('/');
      items = items.splice(-1, 1);
      this.path = items.join('/') + '/';
      this.getPath();
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  upOneFolder() {
    let splits = this.path.split('/');
    splits.splice(-2, 1);
    this.path = splits.join('/');
    this.getPath();
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

  getOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: this.getMode(this.filePath),
      tabSize: 3,
      indentUnit: 3,
      indentAuto:true,
      extraKeys:{
        'Shift-Tab':'indentLess',
        'Tab':'indentMore'
      }
    };
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
      duration: 2000,
      panelClass: ['error-snackbar'],
    });
  }
}

@Component({
  selector: 'new-file-dialog',
  templateUrl: 'new-file-dialog.html',
})
export class NewFileDialog {

  constructor(
    public dialogRef: MatDialogRef<NewFileDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
