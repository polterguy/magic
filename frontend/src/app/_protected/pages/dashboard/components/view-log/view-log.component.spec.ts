import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLogComponent } from './view-log.component';

describe('ViewLogComponent', () => {
  let component: ViewLogComponent;
  let fixture: ComponentFixture<ViewLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
