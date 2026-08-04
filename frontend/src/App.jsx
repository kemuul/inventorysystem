import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// This starter ships the Dashboard fully wired up. The other nav items are
// placeholders — build them out the same way Dashboard.jsx is built
// (a page component + api/*.js calls into the matching backend route).
export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <div className="flex-1 min-w-0">
        <Topbar title={activePage} notificationCount={3} />

        <main className="p-6">
          {activePage === 'Dashboard' ? (
            <Dashboard />
          ) : (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <p className="text-text font-semibold mb-1">{activePage} page</p>
              <p className="text-sm text-muted">
                Not built yet in this starter — follow the Dashboard.jsx pattern to add it.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
