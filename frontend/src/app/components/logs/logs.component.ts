
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { LogService } from 'src/app/services/log-service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  offset = 0;
  limit = 10;

  constructor(private logService: LogService) { }

  ngOnInit() {
    this.logService.listLogItems(this.offset, this.limit).subscribe(res => {
      console.log(res);
    });
  }
}
