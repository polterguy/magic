import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { GeneralService } from '../../services/general.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';
import { EndpointsGeneralService } from '../../services/endpoints-general.service';

@Component({
  selector: 'app-backends-list',
  templateUrl: './backends-list.component.html',
  styleUrls: ['./backends-list.component.scss']
})
export class BackendsListComponent implements OnInit {

  /**
   * List of existing backends
   */
  public backendsList: any = [];

  /**
   * Table's columns initiation
   */
  displayedColumns: string[] = ['username', 'backendURL', 'status', 'actions'];

  /**
   * Specifies the currently in-use backend.
   */
  public activeBackend: string = '';

  /**
   * Turns to true when backendService is ready.
   */
  public isLoading: boolean = true;

  constructor(
    private router: Router,
    private dialogRef: DialogRef<BackendsListComponent>,
    private clipboard: Clipboard,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService,
    private backendService: BackendService,
    private endpointsGeneralService: EndpointsGeneralService) {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    }

  ngOnInit(): void {
    this.getBackends();
  }

  private getBackends() {
    (async () => {
      while (this.backendService.active.access && !Object.keys(this.backendService.active.access.auth).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.auth).length > 0) {
        this.backendsList = this.backendService.backends;
        this.activeBackend = this.backendService.active.url;
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    })();
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
   copyUrlWithBackend(url: string) {
    const currentURL = window.location.protocol + '//' + window.location.host;
    const param = currentURL + '?backend='
    this.clipboard.copy(param + encodeURIComponent(url));
    this.generalService.showFeedback('Backend URL was copied to your clipboard');
  }

  /**
   * Switching to specified backend.
   *
   * @param backend Backend to switch to
   */
  switchBackend(backend: Backend) {
    this.isLoading = true;
    if (backend.token) {
      this.backendService.activate(backend);
      this.backendService.upsert(backend);
      if (this.router.url !== '/setup') {
        window.location.reload();
      } else {
        window.location.href = '/'
      }
      // TODO::: reload must be changed to below actions, so a reliable solution needs to update the active url.

      // this.refetchEndpointsList();
      // this.reloadCurrentRoute();
      // if (this.dialogRef) {
      //   this.dialogRef.close();
      //   this.isLoading = false;
      // }

      return;
    } else {
      this.isLoading = false;
      this.router.navigate(['/authentication/login'], {
        queryParams: { switchTo: backend.url }
      });
      if (this.dialogRef) {
        this.dialogRef.close();
      }
    }
  }

  private reloadCurrentRoute() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
    });
  }

  /**
   * Fetching list of endpoints to be used throughout the app.
   * Only invokes when requesting a refrech of the list.
   */
  private refetchEndpointsList() {
    this.endpointsGeneralService.getEndpoints();
  }

  /**
   * Removes specified backend from local storage
   *
   * @param backend Backend to remove
   */
  removeBackend(backend: Backend) {
    if (this.backendsList.length > 1) {
      const anotherWithToken: any = this.backendsList.find((item: any) => item !== backend && item.token !== null);
      if (anotherWithToken) {
        this.switchBackend(anotherWithToken)
      }
    }
    // For weird reasons the menu gets "stuck" unless we do this in a timer.
    setTimeout(() => this.backendService.remove(backend), 100);
  }

}
