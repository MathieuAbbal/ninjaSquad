import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormLabelValidationDirective } from './form-label-validation.directive';
import { FormLabelDirective } from './form-label.directive';

@Component({
  selector: 'pr-form',
  template: `
    <form [formGroup]="userForm">
      <div class="mb-3" prFormLabelValidation>
        <label prFormLabel for="lastName" class="form-label">Name</label>
        <div>
          <input class="form-control" id="lastName" placeholder="Name" formControlName="lastName" />
        </div>
      </div>
    </form>
  `
})
class FormComponent {
  userForm = new FormGroup({
    lastName: new FormControl('', Validators.required)
  });
}

describe('FormLabelValidationDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [FormComponent, FormLabelValidationDirective, FormLabelDirective]
    })
  );

  it('should switch the field isInvalid from the FormLabelDirective if invalid', () => {
    const fixture = TestBed.createComponent(FormComponent);
    fixture.detectChanges();

    const directiveInstance = fixture.debugElement.query(By.directive(FormLabelDirective)).injector.get(FormLabelDirective);
    expect(directiveInstance.isInvalid).withContext('The directive should let isInvalid to false if the field is not dirty').toBe(false);

    const lastName = fixture.nativeElement.querySelector('#lastName');
    lastName.value = '';
    lastName.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(directiveInstance.isInvalid).withContext('The directive should switch isInvalid to true if the field is invalid').toBe(true);

    lastName.value = 'Raindow';
    lastName.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(directiveInstance.isInvalid).withContext('The directive should switch isInvalid to false if the field is valid').toBe(false);
  });
});
