
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
