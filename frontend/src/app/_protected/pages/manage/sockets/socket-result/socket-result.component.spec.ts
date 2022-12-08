import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketResultComponent } from './socket-result.component';

describe('SocketResultComponent', () => {
  let component: SocketResultComponent;
  let fixture: ComponentFixture<SocketResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocketResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocketResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
