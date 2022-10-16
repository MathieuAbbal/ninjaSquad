import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FormLabelDirective } from './form-label.directive';

@Component({
  selector: 'pr-form',
  template: `<label prFormLabel for="lastName" class="form-label">Name</label>`
})
class FormComponent {}

describe('FormLabelDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      declarations: [FormComponent, FormLabelDirective]
    })
  );

  it('should add the text-danger CSS class to the label if invalid', () => {
    const fixture = TestBed.createComponent(FormComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement.query(By.directive(FormLabelDirective));
    expect(directive).withContext('The directive should be applied to a label with an attribute prFormLabel').not.toBeNull();

    const directiveInstance = directive.injector.get(FormLabelDirective);
    directiveInstance.isInvalid = true;

    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');

    expect(label.classList).withContext('The directive should add the CSS class if isInvalid is true').toContain('text-danger');

    directiveInstance.isInvalid = false;

    fixture.detectChanges();

    expect(label.classList).not.withContext('The directive should remove the CSS class if isInvalid is false').toContain('text-danger');
  });
});
