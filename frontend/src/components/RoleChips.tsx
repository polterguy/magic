/*
 * Checkbox chip per role — the role picker every screen that assigns roles
 * (users, generators, ML types, token generation) renders.
 */

export default function RoleChips(props: {
  roles: (string | { name: string; description?: string })[];
  selected: string[];
  onToggle: (role: string, selected: boolean) => void;
}) {

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {props.roles.map(entry => {
        const role = typeof entry === 'string' ? entry : entry.name;
        const description = typeof entry === 'string' ? undefined : entry.description;
        const isMember = props.selected.includes(role);
        return (
          <label
            key={role}
            className="chip"
            title={description}
            style={{
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
            <input
              type="checkbox"
              checked={isMember}
              onChange={() => props.onToggle(role, !isMember)} />
            {role}
          </label>
        );
      })}
    </div>
  );
}
