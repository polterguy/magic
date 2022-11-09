import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FileNode } from '../../hyper-ide/_models/file-node.model';

@Component({
  selector: 'app-generated-backend',
  templateUrl: './generated-backend.component.html',
  styleUrls: ['./generated-backend.component.scss']
})
export class GeneratedBackendComponent implements OnInit {

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
