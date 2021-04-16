
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
