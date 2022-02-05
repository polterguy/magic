
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */
import { Directive, ViewContainerRef } from '@angular/core';

/**
 * Directive for dynamically injecting components into containers.
 */
@Directive({
  selector: '[appInject]'
})
export class InjectDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }
}
