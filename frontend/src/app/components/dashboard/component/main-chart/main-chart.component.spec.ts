import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainChartComponent } from './main-chart.component';

describe('MainChartComponent', () => {
  let component: MainChartComponent;
  let fixture: ComponentFixture<MainChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
