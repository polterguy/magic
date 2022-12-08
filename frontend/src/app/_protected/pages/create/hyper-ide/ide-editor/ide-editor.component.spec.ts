import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeEditorComponent } from './ide-editor.component';

describe('IdeEditorComponent', () => {
  let component: IdeEditorComponent;
  let fixture: ComponentFixture<IdeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdeEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
