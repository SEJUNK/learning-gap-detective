import { Bell } from "lucide-react";
import { Logo } from "../brand/Logo";
import { IconButton } from "../ui/IconButton";
import { Avatar } from "../ui/Avatar";
import { MOCK_STUDENT } from "../../constants/mockUser";
import "./MobileHeader.css";

interface MobileHeaderProps {
  title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <Logo variant="compact" />
        <div className="mobile-header-actions">
          <IconButton icon={Bell} label="Notifications" size={18} />
          <Avatar name={MOCK_STUDENT.name} size={30} />
        </div>
      </div>
      <h1 className="mobile-header-title">{title}</h1>
    </header>
  );
}
