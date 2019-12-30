
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {

  private isLoading = new BehaviorSubject<boolean>(false);

  show() {
    setTimeout(() => {
      this.isLoading.next(true);
    });
  }

  hide() {
    setTimeout(() => {
      this.isLoading.next(false);
    });
  }
}
