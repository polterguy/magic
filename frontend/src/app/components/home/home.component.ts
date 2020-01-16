
import { Component, OnInit } from '@angular/core';
import { PingService } from 'src/app/services/ping-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private version: string;

  constructor(private pingService: PingService) { }

  ngOnInit(): void {
    this.pingService.version().subscribe(res => {
      this.version = res.version;
    });
  }

  getVersion() {
    return this.version;
  }
}
