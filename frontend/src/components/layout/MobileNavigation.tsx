import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "../../constants/navigation";
import "./MobileNavigation.css";

export function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      <ul>
        {MOBILE_NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) => `mobile-nav-link${isActive ? " active" : ""}`}
              end={path === "/"}
            >
              <Icon size={21} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
