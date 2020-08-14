
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketService } from './ticket-service';
import { Observable } from 'rxjs';

// TODO: Cleanup, too much repetition!
@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  list(filter: string = null) {
    const like = filter === null ||
      filter === '' ||
      filter === undefined ?
        '' :
        '?username.like=' + encodeURIComponent('%' + filter + '%');

    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.get<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users` + like).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  listRoles(filter: string = null) {
    const like = filter === null ||
      filter === '' ||
      filter === undefined ?
        '' :
        '?name.like=' + encodeURIComponent('%' + filter + '%');

    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.get<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/roles` + like).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  createUser(username: string, password: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.post<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users`, {
            username,
            password,
          }).subscribe(res2 => {
            observer.next(res2);
            observer.complete();
          });
        });
      });
  }

  createRole(name: string, description: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.post<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/roles`, {
            name,
            description
          }).subscribe(res2 => {
            observer.next(res2);
            observer.complete();
          });
        });
      });
  }

  deleteUser(username: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.delete<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users?username=` +
            encodeURIComponent(username)).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  deleteRole(name: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.delete<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/roles?name=` +
            encodeURIComponent(name)).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  getRoles(username: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.get<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users_roles?user.eq=` +
            encodeURIComponent(username)).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  addRoleToUser(user: string, role: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.post<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users_roles`, {
              user,
              role,
          }).subscribe(res2 => {
            observer.next(res2);
            observer.complete();
          });
        });
      });
  }

  deleteRoleFromUser(user: string, role: string) {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.delete<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/users_roles?role=` +
            encodeURIComponent(role) +
            '&user=' + encodeURIComponent(user)).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }

  getAllRoles() {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/database').subscribe(res => {
          return this.httpClient.get<any>(
            this.ticketService.getBackendUrl() +
            `magic/modules/${res.database}/roles`).subscribe(res2 => {
              observer.next(res2);
              observer.complete();
            });
        });
      });
  }
}
