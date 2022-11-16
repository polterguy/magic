import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FileNode } from './_models/file-node.model';

@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit {

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
