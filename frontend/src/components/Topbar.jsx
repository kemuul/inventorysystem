import React from 'react';
import { Search, Bell, ChevronDown, UserCircle2 } from 'lucide-react';

export default function Topbar({ title = 'Dashboard', notificationCount = 0 }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-text">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search products, sales, etc..."
            className="w-72 bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-card transition-colors">
          <Bell size={18} className="text-muted" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-loss text-white rounded-full">
              {notificationCount}
            </span>
          )}
        </button>

        <button className="flex items-center gap-2 pl-2 border-l border-border">
          <UserCircle2 size={30} className="text-muted" />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-text leading-tight">Admin</p>
            <p className="text-xs text-muted leading-tight">Administrator</p>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </button>
      </div>
    </header>
  );
}
