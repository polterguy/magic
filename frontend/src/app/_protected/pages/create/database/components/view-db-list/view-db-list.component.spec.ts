import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDbListComponent } from './view-db-list.component';

describe('ViewDbListComponent', () => {
  let component: ViewDbListComponent;
  let fixture: ComponentFixture<ViewDbListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewDbListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDbListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
