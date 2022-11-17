import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleTableConfigComponent } from './single-table-config.component';

describe('SingleTableConfigComponent', () => {
  let component: SingleTableConfigComponent;
  let fixture: ComponentFixture<SingleTableConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleTableConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleTableConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
