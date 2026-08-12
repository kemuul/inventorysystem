import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Bell, ChevronDown, UserCircle2, X, Loader2, AlertCircle,
  Package, Tag, Truck, Inbox
} from 'lucide-react';
import { searchApi } from '../api/searchApi';
import { dashboardApi } from '../api/dashboardApi';

export default function Topbar({ title = 'Dashboard', onNavigate }) {
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // --- Search ---
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // --- Notifications (driven by live low-stock data) ---
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(null);

  // Close either dropdown on an outside click.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search — waits 300ms after typing stops before calling the API.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await searchApi.search(trimmed);
        setSearchResults(res.data);
      } catch (err) {
        setSearchError(err.message || 'Search failed');
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const loadNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await dashboardApi.getLowStockAlerts();
      setNotifications(res.data);
    } catch (err) {
      setNotifError(err.message || 'Failed to load notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const toggleNotifications = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next) loadNotifications(); // refresh so it reflects any recent restocks/adjustments
      return next;
    });
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSearchOpen(value.trim().length > 0);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setSearchOpen(false);
  };

  const goTo = (page) => {
    onNavigate?.(page);
    clearSearch();
    setNotifOpen(false);
  };

  const hasResults =
    searchResults && (searchResults.products.length > 0 || searchResults.categories.length > 0 || searchResults.suppliers.length > 0);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-text">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query.trim() && setSearchOpen(true)}
            placeholder="Search products, categories, suppliers..."
            className="w-72 bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {query && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          )}

          {searchOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-20">
              {searchLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted py-6">
                  <Loader2 size={14} className="animate-spin" />
                  Searching...
                </div>
              )}

              {!searchLoading && searchError && (
                <div className="flex items-center gap-2 text-sm text-loss px-4 py-4">
                  <AlertCircle size={14} />
                  {searchError}
                </div>
              )}

              {!searchLoading && !searchError && searchResults && !hasResults && (
                <div className="flex flex-col items-center gap-2 text-muted py-6">
                  <Inbox size={18} />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              )}

              {!searchLoading && !searchError && hasResults && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.products.length > 0 && (
                    <div className="px-2 mb-2">
                      <p className="px-2 text-[11px] font-semibold tracking-wider text-muted mb-1">PRODUCTS</p>
                      {searchResults.products.map((p) => (
                        <button
                          key={`p-${p.id}`}
                          onClick={() => goTo('Products')}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                        >
                          <Package size={14} className="text-muted shrink-0" />
                          <span className="text-sm text-text truncate">{p.name}</span>
                          <span className="text-xs text-muted ml-auto shrink-0">{p.sku}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.categories.length > 0 && (
                    <div className="px-2 mb-2">
                      <p className="px-2 text-[11px] font-semibold tracking-wider text-muted mb-1">CATEGORIES</p>
                      {searchResults.categories.map((c) => (
                        <button
                          key={`c-${c.id}`}
                          onClick={() => goTo('Categories')}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                        >
                          <Tag size={14} className="text-muted shrink-0" />
                          <span className="text-sm text-text truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.suppliers.length > 0 && (
                    <div className="px-2">
                      <p className="px-2 text-[11px] font-semibold tracking-wider text-muted mb-1">SUPPLIERS</p>
                      {searchResults.suppliers.map((s) => (
                        <button
                          key={`s-${s.id}`}
                          onClick={() => goTo('Suppliers')}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                        >
                          <Truck size={14} className="text-muted shrink-0" />
                          <span className="text-sm text-text truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-card transition-colors"
          >
            <Bell size={18} className="text-muted" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-loss text-white rounded-full">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text">Notifications</p>
              </div>

              {notifLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted py-6">
                  <Loader2 size={14} className="animate-spin" />
                  Loading...
                </div>
              )}

              {!notifLoading && notifError && (
                <div className="flex items-center gap-2 text-sm text-loss px-4 py-4">
                  <AlertCircle size={14} />
                  {notifError}
                </div>
              )}

              {!notifLoading && !notifError && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 text-muted py-6">
                  <Inbox size={18} />
                  <p className="text-sm">You're all caught up.</p>
                </div>
              )}

              {!notifLoading && !notifError && notifications.length > 0 && (
                <>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {notifications.map((item) => {
                      const isOut = item.status === 'Out of Stock';
                      return (
                        <button
                          key={item.id}
                          onClick={() => goTo('Stocks')}
                          className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isOut ? 'bg-loss/15' : 'bg-amber-400/15'
                            }`}
                          >
                            <Package size={14} className={isOut ? 'text-loss' : 'text-amber-400'} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-text truncate">
                              {item.name} {isOut ? 'is out of stock' : 'is running low'}
                            </p>
                            <p className="text-xs text-muted">{item.current_stock} left</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => goTo('Stocks')}
                    className="w-full text-center text-sm font-medium text-primary hover:underline py-2.5 border-t border-border"
                  >
                    View all in Stocks
                  </button>
                </>
              )}
            </div>
          )}
        </div>

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
