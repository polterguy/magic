import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileActionsComponent } from './file-actions.component';

describe('FileActionsComponent', () => {
  let component: FileActionsComponent;
  let fixture: ComponentFixture<FileActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileActionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
