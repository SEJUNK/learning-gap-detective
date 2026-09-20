import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { Avatar } from "../ui/Avatar";
import { MOCK_STUDENT } from "../../constants/mockUser";
import "./TopBar.css";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <IconButton icon={Bell} label="Notifications" />

        <div className="topbar-profile" ref={menuRef}>
          <button
            type="button"
            className="topbar-profile-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={MOCK_STUDENT.name} size={32} />
            <span className="topbar-profile-name">{MOCK_STUDENT.name}</span>
            <ChevronDown size={14} className={`topbar-profile-chevron${menuOpen ? " open" : ""}`} />
          </button>

          {menuOpen && (
            <div className="topbar-menu" role="menu">
              <button type="button" role="menuitem" className="topbar-menu-item">
                <User size={15} /> Profile
              </button>
              <button type="button" role="menuitem" className="topbar-menu-item">
                <Settings size={15} /> Settings
              </button>
              <button type="button" role="menuitem" className="topbar-menu-item topbar-menu-item-danger">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
