import { Role } from '../../lib/api';
import RoleChips from '../RoleChips';

/*
 * The optional roles picker the invite and create user dialogs share.
 */
export default function RolesField(
  props: Readonly<{ roles: Role[]; selected: string[]; onChange: (selected: string[]) => void }>,
) {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles (optional)</div>
      <RoleChips
        roles={props.roles}
        selected={props.selected}
        onToggle={(role, selected) =>
          props.onChange(
            selected
              ? [...props.selected, role]
              : props.selected.filter(candidate => candidate !== role),
          )
        }
      />
    </div>
  );
}
