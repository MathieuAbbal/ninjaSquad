import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'label[prFormLabel]'
})
export class FormLabelDirective {
  @HostBinding('class.text-danger') isInvalid: boolean | null = false;
}
