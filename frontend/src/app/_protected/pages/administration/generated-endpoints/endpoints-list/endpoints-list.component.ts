import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { Observable } from 'rxjs';
import { AssumptionsComponent } from 'src/app/_general/components/assumptions/assumptions.component';

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
    private backendService: BackendService) { }

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

  getPath(path: string) {
    return path.split('?')[0];
  }

  public requestEditor(item: any) {
    item.path = item.path.split('?')[0];
    this.selectedItem = item;
    this.changeEditor.emit(item);
  }

  public copyUrl(url: string) {
    this.clipboard.copy(this.backendService.active.url + '/' + url);
    this.generalService.showFeedback('URL is copied to your clipboard');
  }
  @ViewChild('assumptions', {static: false}) assumptions: AssumptionsComponent;
  /**
   * For tracking the virtual scrolling on filterList
   * @param item
   * @returns item
   */
  public trackFilterList(item: any) {
    return item;
  }

  public refetchAssumptions() {
    this.assumptions.getAssumptions()
  }
}
