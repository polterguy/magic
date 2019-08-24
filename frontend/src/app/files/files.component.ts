
import { Component, OnInit } from '@angular/core';
import { FileService } from '../services/file-service';

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
  private fileContent: string;

  constructor(private service: FileService) { }

  ngOnInit() {
    this.getPath();
  }

  getPath() {
    this.service.listFiles(this.path).subscribe((res) => {
      this.files = res;
    });
    this.service.listFolders(this.path).subscribe((res) => {
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
      this.openFile(path);
    }
  }

  upOneFolder() {
    let splits = this.path.split('/');
    splits.splice(-2, 1);
    this.path = splits.join('/');
    this.getPath();
    return false;
  }

  openFile(path: string) {
    this.service.getFileContent(path).subscribe((res) => {
      this.fileContent = res;
    })
  }
}
