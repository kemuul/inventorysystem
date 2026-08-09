import React from 'react';
import {
  Boxes, LayoutDashboard, Package, ListTree, Tags, Truck,
  LineChart, DollarSign, Gauge, FileBarChart, Users, Settings, LogOut
} from 'lucide-react';

const navSections = [
  {
    label: 'INVENTORY',
    items: [
      { name: 'Stocks', icon: Package },
      { name: 'Products', icon: ListTree },
      { name: 'Categories', icon: Tags },
      { name: 'Suppliers', icon: Truck }
    ]
  },
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Profit & Loss', icon: LineChart },
      { name: 'Pricing', icon: DollarSign },
      { name: 'Market Value', icon: Gauge },
      { name: 'Reports', icon: FileBarChart }
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { name: 'Users', icon: Users },
      { name: 'Settings', icon: Settings }
    ]
  }
];

export default function Sidebar({ active = 'Dashboard', onNavigate = () => {} }) {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Boxes size={18} className="text-primary" />
        </div>
        <span className="font-bold text-lg text-text">InventoryPro</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Dashboard (top-level, no section label) */}
        <button
          onClick={() => onNavigate('Dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === 'Dashboard' ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-white/5 hover:text-text'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-muted">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-white/5 hover:text-text'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-white/5 hover:text-loss transition-colors">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
