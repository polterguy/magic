import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendEditorComponent } from './backend-editor.component';

describe('BackendEditorComponent', () => {
  let component: BackendEditorComponent;
  let fixture: ComponentFixture<BackendEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackendEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
