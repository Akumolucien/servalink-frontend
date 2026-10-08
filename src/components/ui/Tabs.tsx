import type { KeyboardEvent } from "react";

export interface TabDef<T extends string> { id: T; label: string; count?: number }

/** Accessible tablist: arrow keys move between tabs. The caller renders the matching panel. */
export function Tabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: TabDef<T>[]; value: T; onChange: (id: T) => void; label: string;
}) {
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    onChange(tabs[next].id);
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button key={tab.id} role="tab" className="tab" aria-selected={tab.id === value} tabIndex={tab.id === value ? 0 : -1}
          onClick={() => onChange(tab.id)} onKeyDown={(event) => onKey(event, index)}>
          {tab.label}
          {tab.count !== undefined && <span className="count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
