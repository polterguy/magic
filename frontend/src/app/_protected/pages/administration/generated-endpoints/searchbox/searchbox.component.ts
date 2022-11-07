import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html',
  styleUrls: ['./searchbox.component.scss']
})
export class SearchboxComponent implements OnInit {

  @Input() hasSystemEndpoints: boolean = false;
  @Input() systemEndpointChecked: boolean = false;
  @Output() filterList = new EventEmitter<any>();
  filterControl: FormControl;

  constructor() { }

  ngOnInit(): void {
    this.filterControl = new FormControl('');
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        this.applyFilter(query);
      });
  }

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   public applyFilter(keyword: string) {
    this.filterList.emit({searchKey: keyword});
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterList.emit({searchKey: ''});
  }

  public toggleSystemEndpoints() {
    this.filterList.emit({ defaultListToShow: this.systemEndpointChecked ? 'system' : 'other', searchKey: '' });
  }
}
