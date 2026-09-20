import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_SECTIONS } from "../../constants/navigation";
import { Logo } from "../brand/Logo";
import { Tooltip } from "../ui/Tooltip";
import "./DesktopSidebar.css";

const STORAGE_KEY = "lgd-sidebar-collapsed";

export function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // per-viewer convenience only — ignore storage failures (private mode, etc.)
    }
  }, [collapsed]);

  return (
    <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <Logo variant={collapsed ? "compact" : "full"} />
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section, index) => (
          <div className="sidebar-section" key={section.label ?? `section-${index}`}>
            {section.label && !collapsed && <span className="sidebar-section-label">{section.label}</span>}
            <ul>
              {section.items.map(({ label, path, icon: Icon }) => {
                const link = (
                  <NavLink
                    to={path}
                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    end={path === "/"}
                  >
                    <Icon size={18} strokeWidth={2} />
                    {!collapsed && <span>{label}</span>}
                  </NavLink>
                );

                return <li key={path}>{collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link}</li>;
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-collapse-toggle"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
