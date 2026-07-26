/*
 * Material-style tab strip — the app-wide way to switch sub-views inside
 * a page or dialog.
 */

export interface TabDefinition {
  id: string;
  label: string;
}

export default function Tabs(props: {
  tabs: TabDefinition[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs">
      {props.tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={'tab' + (tab.id === props.active ? ' active' : '')}
          onClick={() => props.onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
