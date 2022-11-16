import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FileNode } from '../../tools/hyper-ide/_models/file-node.model';

@Component({
  selector: 'app-generated-frontend',
  templateUrl: './generated-frontend.component.html',
  styleUrls: ['./generated-frontend.component.scss']
})
export class GeneratedFrontendComponent implements OnInit {

  /**
   * Currently selected file.
   */
  public currentFileData: FileNode;

  public searchKey: Observable<string>;

  constructor() { }

  ngOnInit(): void {
  }

  public showEditor(event: { currentFileData: any }) {
    this.currentFileData = event.currentFileData;
  }

  public filterList(event: any) {
    this.searchKey = event;
  }
}
