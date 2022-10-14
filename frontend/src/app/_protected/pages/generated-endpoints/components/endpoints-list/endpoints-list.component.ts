import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { debounceTime, Observable } from 'rxjs';

@Component({
  selector: 'app-endpoints-list',
  templateUrl: './endpoints-list.component.html',
  styleUrls: ['./endpoints-list.component.scss']
})
export class EndpointsListComponent implements OnInit {

  @Input() endpoints: any = [];
  @Input() defaultListToShow: string = 'system';
  @Input() result: any;
  @Input() payload: any;
  @Input() isLoading: Observable<boolean>;

  @Output() changeEditor = new EventEmitter<any>();

  public assumptionsPermission: boolean = false;
  public testPermission: boolean = false;

  public selectedItem: any;

  constructor(
    private clipboard: Clipboard,
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private backendService: BackendService) {

    }

  ngOnInit(): void {
    (async () => {
      while (this.backendService.active.access && !Object.keys(this.backendService.active.access.endpoints).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.endpoints).length > 0) {

        this.assumptionsPermission = this.backendService.active.access.endpoints.assumptions;
        this.testPermission = this.backendService.active.access.diagnostics.execute_test

        this.cdr.detectChanges();
      }
    })();
  }

  // private checkLoading() {
  //   this.isLoading.subscribe((isLoading: boolean) => {

  //   })
  // }

  public requestEditor(item: any) {
    this.selectedItem = item;
    this.changeEditor.emit(item);
  }

  public copyUrl(url: string) {
    this.clipboard.copy(url);
    this.generalService.showFeedback('URL is copied to your clipboard');
  }

  /**
   * For tracking the virtual scrolling on filterList
   * @param item
   * @returns item
   */
   public trackFilterList(item: any) {
    return item;
  }
}
