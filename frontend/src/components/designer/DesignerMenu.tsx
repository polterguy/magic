import Menu from './Menu';
import { DesignerMenuOptions, designerMenuItems } from './menuItems';

// The "more" menu in the toolbar, built from the designer's current state.
export default function DesignerMenu(props: Readonly<DesignerMenuOptions>) {
  return <Menu title="Viewport, preview and the rest" items={designerMenuItems(props)} />;
}
