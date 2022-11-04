import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendTreeComponent } from './frontend-tree.component';

describe('FrontendTreeComponent', () => {
  let component: FrontendTreeComponent;
  let fixture: ComponentFixture<FrontendTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontendTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontendTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
