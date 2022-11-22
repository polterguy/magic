export interface NavLinks {
  name: string,
  url: string,
  expandable: boolean,
  color?: string,
  submenu?: Submenu[],
  isActive?: any
}

export interface Submenu {
  name: string,
  url?: string,
  disabled?: boolean,
  color?: string
}
