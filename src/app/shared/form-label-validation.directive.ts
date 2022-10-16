import { Directive, AfterContentInit, ContentChild } from '@angular/core';
import { NgControl } from '@angular/forms';

import { FormLabelDirective } from './form-label.directive';

@Directive({
  selector: '[prFormLabelValidation]'
})
export class FormLabelValidationDirective implements AfterContentInit {
  @ContentChild(NgControl) ngControl!: NgControl;

  @ContentChild(FormLabelDirective) label!: FormLabelDirective;

  ngAfterContentInit(): void {
    if (this.ngControl && this.label) {
      this.setLabelValidity();
      this.ngControl.statusChanges!.subscribe(() => this.setLabelValidity());
    }
  }

  private setLabelValidity(): void {
    this.label.isInvalid = this.ngControl.invalid && this.ngControl.dirty;
  }
}
