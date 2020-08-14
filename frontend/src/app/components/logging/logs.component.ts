
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { LogService } from 'src/app/services/log-service';
import { LogItem } from 'src/app/models/log-item';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  public offset = 0;
  public limit = 10;
  public items: LogItem[] = null;
  public displayedColumns: string[] = ['when', 'type', 'content'];

  constructor(private logService: LogService) { }

  ngOnInit() {
    this.logService.listLogItems(this.offset, this.limit).subscribe(res => {
      this.items = res;
    });
  }
}
