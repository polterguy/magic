import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderActionsComponent } from './folder-actions.component';

describe('FolderActionsComponent', () => {
  let component: FolderActionsComponent;
  let fixture: ComponentFixture<FolderActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FolderActionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
