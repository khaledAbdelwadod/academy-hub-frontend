/** A row of pill tabs that switch between sections of one page, styled like the top nav's tabs. */

import type { ReactElement } from "react";

interface TabStripProps<TabId extends string> {
  tabs: ReadonlyArray<{ id: TabId; label: string }>;
  active: TabId;
  onChange: (id: TabId) => void;
  /** Accessible name for the group of tabs, e.g. "Academy profile sections". */
  label: string;
}

function tabClassName(isActive: boolean): string {
  return `shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
    isActive ? "bg-mint text-white" : "text-black hover:bg-mint hover:text-white"
  }`;
}

export function TabStrip<TabId extends string>({ tabs, active, onChange, label }: TabStripProps<TabId>): ReactElement {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={tabClassName(tab.id === active)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
