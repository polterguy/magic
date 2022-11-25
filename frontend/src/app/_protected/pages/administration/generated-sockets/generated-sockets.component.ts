import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { HubConnection } from '@aspnet/signalr';
import { Observable } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Count } from 'src/app/_protected/models/common/count.model';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { SocketUser } from '../generated-endpoints/_models/socket-user.model';
import { SocketService } from './_services/socket.service';

@Component({
  selector: 'app-generated-sockets',
  templateUrl: './generated-sockets.component.html',
  styleUrls: ['./generated-sockets.component.scss']
})
export class GeneratedSocketsComponent implements OnInit {

  /**
   * Users connected to a socket according to filtering condition,
   * as returned from our backend.
   */
  users: SocketUser[] = [];

  /**
   * Currently expanded element.
   */
  expandedElement: SocketUser | null;

  /**
   * Number of socket connections matching specified filtering condition.
   */
  count: number;

  /**
   * Filter form control for filtering connections to display according to users.
   */
  filterFormControl: FormControl;

  /**
   * What users are currently being edited and viewed.
   */
  selectedUsers: string[] = [];



  public searchKey: string = '';

  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;

  /**
  * Creates an instance of your component.
  *
  * @param dialog Needed to create modal dialogues
  * @param socketService Needed retrieve socket information and publish socket messages
  * @param backendService Needed to retrieve backend URL to connect to web sockets in backend
  * @param generalService Needed to provide feedback to user
  */
  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getConnections();
    this.getCount();
  }

  public filterList(event: any) {
    this.searchKey = event;
  }

  /*
     * Returns connections to caller by unvoking backend.
     */
  public getConnections(getCount?: boolean) {
    this.socketService.socketUsers(
      this.searchKey,
      this.pageIndex * this.pageSize,
      this.pageSize).subscribe({
        next: (users: SocketUser[]) => {
          this.selectedUsers = [];
          this.users = users ?? [];
          if (getCount && this.users.length > 0) {
            this.getCount();
          } else if (getCount && this.users.length === 0) {
            this.totalItems = 0;
          }
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
  }

  private getCount() {
    this.socketService.socketUserCount(this.searchKey).subscribe({
      next: (count: Count) => this.count = count.count,
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
   public changePage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getConnections();
  }

}
