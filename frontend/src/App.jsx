import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Stocks from './pages/Stocks';
import Suppliers from './pages/Suppliers';

// Maps a Sidebar nav item straight to its page component. Every entry here
// follows the same shape (api/*.js + useState/useEffect + PageHeader +
// TableStatusRow) so adding the next module (Users, Settings, Reports...)
// is just: build the page, add one line here.
const PAGES = {
  Dashboard,
  Categories,
  Products,
  Stocks,
  Suppliers
};

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const ActivePageComponent = PAGES[activePage];

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <div className="flex-1 min-w-0">
        <Topbar title={activePage} notificationCount={3} />

        <main className="p-6">
          {ActivePageComponent ? (
            <ActivePageComponent />
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
