
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatSnackBar
} from '@angular/material';
import { FileService } from 'src/app/services/file-service';

export interface DialogData {
  path: string;
  content: string;
  select: boolean;
  header: string;
  filename?: string;
}

@Component({
  templateUrl: 'file-dialog.html',
  styleUrls: ['file-dialog.scss'],
})
export class FileDialogComponent implements OnInit {

  @ViewChild('nameElement', {static: true}) nameElement: ElementRef;
  public files: string[] = [];
  public displayedColumns: string[] = ['filename'];
  public name = '';

  constructor(
    public dialogRef: MatDialogRef<FileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private fileService: FileService) { }

  ngOnInit() {
    this.fileService.listFiles('/misc/snippets/').subscribe(res => {
      this.files = res.filter(x => x.endsWith('.hl'));
    });
    console.log(this.data);
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
      let result = x.substr(x.lastIndexOf('/') + 1);
      result = result.substr(0, result.lastIndexOf('.'));
      return result.includes(this.name);
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
