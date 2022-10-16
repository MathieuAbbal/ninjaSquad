import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { FormControlValidationDirective } from './form-control-validation.directive';
import { FormLabelDirective } from './form-label.directive';
import { FormLabelValidationDirective } from './form-label-validation.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [FormControlValidationDirective, FormLabelDirective, FormLabelValidationDirective],
  exports: [FormControlValidationDirective, FormLabelDirective, FormLabelValidationDirective, NgbAlertModule, NgbPaginationModule]
})
export class SharedModule {}
