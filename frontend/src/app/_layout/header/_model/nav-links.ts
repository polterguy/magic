
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { SubMenu } from "./sub-menu";

export interface NavLinks {
  name: string,
  url: string,
  expandable: boolean,
  color?: string,
  submenu?: SubMenu[],
  isActive?: any,
  exact?: boolean,
}
