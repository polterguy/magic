
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

export interface NavLinks {
  name: string,
  url: string,
  expandable: boolean,
  color?: string,
  submenu?: Submenu[],
  isActive?: any,
  exact?: boolean
}

export interface Submenu {
  name: string,
  url?: string,
  disabled?: boolean,
  color?: string,
  exact?: boolean,
}
