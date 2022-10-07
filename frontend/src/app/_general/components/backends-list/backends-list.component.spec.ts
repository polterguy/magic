import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendsListComponent } from './backends-list.component';

describe('BackendsListComponent', () => {
  let component: BackendsListComponent;
  let fixture: ComponentFixture<BackendsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackendsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
