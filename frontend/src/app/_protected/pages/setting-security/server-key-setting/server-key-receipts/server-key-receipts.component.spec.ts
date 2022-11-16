import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerKeyReceiptsComponent } from './server-key-receipts.component';

describe('ServerKeyReceiptsComponent', () => {
  let component: ServerKeyReceiptsComponent;
  let fixture: ComponentFixture<ServerKeyReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerKeyReceiptsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerKeyReceiptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
