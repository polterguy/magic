import { Role } from '@core/api';
import RoleChips from '@shared/ui/RoleChips';

/*
 * The optional roles picker the invite and create user dialogs share.
 */
export default function RolesField(
  props: Readonly<{ roles: Role[]; selected: string[]; onChange: (selected: string[]) => void }>,
) {
  return (
    <div className="form-group">
      <div className="form-group-label">Roles (optional)</div>
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
