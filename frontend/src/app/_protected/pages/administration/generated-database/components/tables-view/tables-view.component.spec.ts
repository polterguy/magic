import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesViewComponent } from './tables-view.component';

describe('TablesViewComponent', () => {
  let component: TablesViewComponent;
  let fixture: ComponentFixture<TablesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TablesViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
