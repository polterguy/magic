import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {

  @Output() hideInfoPanel = new EventEmitter<any>();
  constructor() { }

  ngOnInit(): void {
  }

  public hidePanel() {
    this.hideInfoPanel.emit();
  }
}
