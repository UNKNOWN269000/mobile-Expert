import { useEffect, useState } from 'react';
import { useAppStore, resolveTheme, ThemeMode } from '../store/appStore';
import { useAuth } from '../lib/AuthContext';
import { CartIcon, HeartIcon, SearchIcon, UserIcon, MenuIcon, XIcon } from './Icons';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, data?: any) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const cart = useAppStore((s) => s.cart);
  const wishlist = useAppStore((s) => s.wishlist);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const theme = useAppStore((s) => s.theme);
  const cycleTheme = useAppStore((s) => s.cycleTheme);
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply theme to <html>:
  //   - 'auto'   → follow the device's system preference (live)
  //   - 'light'  → always light
  //   - 'dark'   → always dark
  useEffect(() => {
    const apply = (mode: ThemeMode) => {
      const effective = resolveTheme(mode);
      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    apply(theme);

    // For 'auto' mode, listen to OS-level theme changes so the app reacts
    // live when the user toggles their device's dark mode at the OS level.
    if (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => apply('auto');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [theme]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // Listen for global "open auth modal" requests (e.g. when a guest
  // clicks a product and we want them to sign in first).
  useEffect(() => {
    const handler = () => setAuthOpen(true);
    window.addEventListener('mobile-expert:open-auth', handler);
    return () => window.removeEventListener('mobile-expert:open-auth', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('shop');
    setMobileOpen(false);
  };

  /**
   * Auto-navigate to /shop as soon as the user types 2+ characters,
   * so results show up live. Debounced to avoid spamming navigation
   * on every keystroke.
   */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const t = setTimeout(() => {
      // Only navigate if we're not already on the shop page
      onNavigate('shop');
    }, 600);
    return () => clearTimeout(t);
  }, [searchQuery, onNavigate]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 sm:gap-3"
          >
            <img
              src="./logo-icon.png"
              alt="Mobile Expert"
              className="h-9 w-9 rounded-xl object-contain shadow-md sm:h-10 sm:w-10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="hidden sm:block">
              <div className="text-lg font-bold leading-none text-slate-900 dark:text-white">
                Mobile Expert
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mobiles · Accessories · Electronics
              </div>
            </div>
          </button>

          <form onSubmit={handleSearch} className="hidden flex-1 max-w-2xl md:flex">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phones, laptops, cameras..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/20"
              />
            </div>
          </form>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('shop')}
              className={`hidden rounded-full px-3 py-1.5 text-sm font-medium transition sm:inline-block ${
                currentPage === 'shop'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shop
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('sell')}
                className={`hidden items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition sm:inline-flex ${
                  currentPage === 'sell'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span>🛡️</span>
                <span>Sell</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Wishlist"
            >
              <HeartIcon className="h-5 w-5" size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('cart')}
              className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cart"
            >
              <CartIcon className="h-5 w-5" size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={cycleTheme}
              className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
              title={
                theme === 'auto'
                  ? 'Theme: Auto (follows device) — click for Light'
                  : theme === 'light'
                  ? 'Theme: Light — click for Dark'
                  : 'Theme: Dark — click for Auto'
              }
            >
              {theme === 'auto' ? (
                // Half-moon icon: indicates "automatic / device-following"
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" stroke="none" />
                </svg>
              ) : theme === 'light' ? (
                // Sun icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                // Moon icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
              {theme === 'auto' && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline">
                    {user.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {user.displayName || 'User'}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('account');
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <UserIcon className="h-4 w-4" size={16} />
                      My account
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </nav>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 py-3 dark:border-slate-800 md:hidden">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onNavigate('shop');
                  setMobileOpen(false);
                }}
                className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Shop
              </button>
              {isAdmin ? (
                <button
                  onClick={() => {
                    onNavigate('sell');
                    setMobileOpen(false);
                  }}
                  className="flex-1 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white"
                >
                  🛡️ Sell
                </button>
              ) : (
                <button
                  onClick={() => {
                    onNavigate('account');
                    setMobileOpen(false);
                  }}
                  className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Account
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
