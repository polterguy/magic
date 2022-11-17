import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportDdlComponent } from './export-ddl.component';

describe('ExportDdlComponent', () => {
  let component: ExportDdlComponent;
  let fixture: ComponentFixture<ExportDdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportDdlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportDdlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
