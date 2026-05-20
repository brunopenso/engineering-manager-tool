import { NavLink } from 'react-router-dom';
import type { ShellMenuOption } from '../../routes/shellOptions.js';

type ShellNavigationProps = {
  isExpanded: boolean;
  options: ShellMenuOption[];
  onToggle: () => void;
  onOptionSelected: () => void;
};

export default function ShellNavigation({
  isExpanded,
  options,
  onToggle,
  onOptionSelected,
}: ShellNavigationProps) {
  return (
    <aside>
      <button type="button" onClick={onToggle} aria-expanded={isExpanded}>
        Menu
      </button>
      {isExpanded ? (
        <nav aria-label="App navigation">
          <ul>
            {options.map((option) => (
              <li key={option.id}>
                <NavLink
                  to={option.route}
                  onClick={onOptionSelected}
                  aria-disabled={!option.available}
                >
                  {option.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </aside>
  );
}
