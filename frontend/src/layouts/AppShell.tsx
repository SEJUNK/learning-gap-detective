import type { ReactNode } from "react";
import { useIsMobile } from "../hooks/useViewport";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { TopBar } from "../components/layout/TopBar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { MobileNavigation } from "../components/layout/MobileNavigation";
import "./AppShell.css";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

/**
 * Renders distinct navigation shells per breakpoint rather than shrinking
 * one layout: desktop gets a persistent sidebar + top bar, mobile gets a
 * compact header + bottom tab bar.
 */
export function AppShell({ title, children }: AppShellProps) {
  const isMobile = useIsMobile();

  const skipLink = (
    <a href="#main-content" className="skip-to-content-link">
      Skip to main content
    </a>
  );

  if (isMobile) {
    return (
      <div className="app-shell app-shell-mobile">
        {skipLink}
        <MobileHeader title={title} />
        <main id="main-content" key={title} className="app-content app-content-mobile page-transition" tabIndex={-1}>
          {children}
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="app-shell app-shell-desktop">
      {skipLink}
      <DesktopSidebar />
      <div className="app-shell-main">
        <TopBar title={title} />
        <main id="main-content" key={title} className="app-content page-transition" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
