import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointDialogComponent } from './endpoint-dialog.component';

describe('EndpointDialogComponent', () => {
  let component: EndpointDialogComponent;
  let fixture: ComponentFixture<EndpointDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EndpointDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndpointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
