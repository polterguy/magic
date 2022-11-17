import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetNameDialogComponent } from './snippet-name-dialog.component';

describe('SnippetNameDialogComponent', () => {
  let component: SnippetNameDialogComponent;
  let fixture: ComponentFixture<SnippetNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnippetNameDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
