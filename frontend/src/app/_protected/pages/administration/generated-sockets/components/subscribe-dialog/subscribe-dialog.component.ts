import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

@Component({
  selector: 'app-subscribe-dialog',
  templateUrl: './subscribe-dialog.component.html',
  styleUrls: ['./subscribe-dialog.component.scss']
})
export class SubscribeDialogComponent implements OnInit {

  public name: string = '';

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog
   * @param data Injected data being message name of message returned as dialog is closed
   */
  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<SubscribeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    console.log(this.data)
  }

  /**
   * Invoked when user wants to subscribe to the specified message.
   */
  public connect() {
    if (this.data && this.data.length > 0 && this.data.filter((item: any) => item === this.name).length > 0) {
      this.generalService.showFeedback('You are already subscribing to this messages', 'errorMessage');
      return;
    }
    if (this.name === '') {
      this.generalService.showFeedback('Please give your message a name.', 'errorMessage');
      return;
    }
    // Closing dialog making sure we provide message name to caller.
    this.dialogRef.close(this.name);
  }

}
