import { useState, type ReactNode } from "react";
import "./Tabs.css";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
}

export function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === activeId}
            className={`tabs-trigger${tab.id === activeId ? " active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="tabs-panel">
        {activeTab?.content}
      </div>
    </div>
  );
}
