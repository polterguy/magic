
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from 'src/app/services/file-service';

export interface FileDialogData {
  path: string;
  content: string;
  select: boolean;
  header: string;
  filename?: string;
}

class File {
  filename: string;
  content: string;
}

@Component({
  templateUrl: 'file-dialog.html',
  styleUrls: ['file-dialog.scss'],
})
export class FileDialogComponent implements OnInit {

  @ViewChild('nameElement', {static: true}) nameElement: ElementRef;
  public files: File[] = [];
  public displayedColumns: string[] = ['filename'];
  public name = '';

  constructor(
    public dialogRef: MatDialogRef<FileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileDialogData,
    private snackBar: MatSnackBar,
    private fileService: FileService) { }

  ngOnInit() {
    this.fileService.listFiles('/misc/snippets/').subscribe(res => {
      this.files = res.filter(x => x.endsWith('.hl')).map(x => {
        return {
          filename: x,
          content: null,
        };
      });
    });
    if (this.data.filename) {
      this.name = this.data.filename;
    }
    setTimeout(() => {
      this.nameElement.nativeElement.select();
      this.nameElement.nativeElement.focus();
    }, 100);
  }

  getFilteredFiles() {
    if (this.name === '') {
      return this.files;
    }
    return this.files.filter(x => {
      let result = x.filename.substr(x.filename.lastIndexOf('/') + 1);
      result = result.substr(0, result.lastIndexOf('.'));
      if (result.includes(this.name)) {
        return true;
      }
      return false;
    });
  }

  getFileName(path: string) {
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  selectFile(file: string) {
    if (this.data.select) {
      this.fileService.getFileContent(file).subscribe(res => {
        this.data.content = res;
        this.data.path = file;
        this.dialogRef.close(this.data);
      });
    } else {
      const result = file.substr(file.lastIndexOf('/') + 1);
      this.name = result.substr(0, result.lastIndexOf('.'));
      setTimeout(() => {
        this.nameElement.nativeElement.select();
        this.nameElement.nativeElement.focus();
      }, 100);
    }
  }

  saveClicked() {
    if (this.name.includes('/') || this.name.endsWith('.hl')) {
      this.showError('No \'/\' or ending with \'.hl\' please');
      setTimeout(() => {
        this.nameElement.nativeElement.select();
        this.nameElement.nativeElement.focus();
      }, 100);
      return;
    }
    this.data.path = '/misc/snippets/' + this.name + '.hl';
    this.dialogRef.close(this.data);
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 2000,
    });
  }
}
