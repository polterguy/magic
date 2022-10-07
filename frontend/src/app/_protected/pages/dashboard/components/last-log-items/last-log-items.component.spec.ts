import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastLogItemsComponent } from './last-log-items.component';

describe('LastLogItemsComponent', () => {
  let component: LastLogItemsComponent;
  let fixture: ComponentFixture<LastLogItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LastLogItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LastLogItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
