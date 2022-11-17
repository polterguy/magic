import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDbComponent } from './view-db.component';

describe('ViewDbComponent', () => {
  let component: ViewDbComponent;
  let fixture: ComponentFixture<ViewDbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewDbComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
