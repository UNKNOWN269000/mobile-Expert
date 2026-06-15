import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../lib/AuthContext';
import {
  ClockIcon,
  HeartIcon,
  PackageIcon,
  StoreIcon,
  UserIcon,
} from '../components/Icons';
import { subscribeToListings, deleteListing } from '../lib/firebaseServices';
import { Listing } from '../data/products';
import { formatLKR } from '../lib/format';

export function AccountPage() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const orders = useAppStore((s) => s.orders);
  const wishlist = useAppStore((s) => s.wishlist);
  const localListings = useAppStore((s) => s.listings);
  const removeListing = useAppStore((s) => s.removeListing);
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<'orders' | 'listings' | 'profile'>('orders');

  // Live-subscribe to current user's listings from the database
  useEffect(() => {
    if (!user) {
      setDbListings([]);
      return;
    }
    const unsubscribe = subscribeToListings((items) => {
      setDbListings(items.filter((l) => l.sellerId === user.uid));
    }, user.uid);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

  const handleRemoveListing = async (id: string) => {
    removeListing(id);
    try {
      await deleteListing(id);
    } catch {
      /* ignore */
    }
  };

  // Merge local + DB listings, dedup by id
  const allMyListings: Listing[] = (() => {
    const byId = new Map<string, Listing>();
    dbListings.forEach((l) => l.id && byId.set(l.id, l));
    localListings.forEach((l) => l.id && byId.set(l.id, l));
    return Array.from(byId.values()).sort((a, b) => (b.date > a.date ? 1 : -1));
  })();

  // ===== Pull all display values from the database profile (not hardcoded) =====
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '';
  const mobile = profile?.mobile || '';
  const provider = profile?.provider || 'email';
  const initials = displayName
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt as number)
    : null;
  const memberSinceLabel = memberSince
    ? memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'New member';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* =================== HEADER CARD =================== */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {user?.photoURL || profile?.photoURL ? (
            <img
              src={user?.photoURL || profile?.photoURL}
              alt=""
              className="h-20 w-20 rounded-full border-4 border-white/20 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold backdrop-blur">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>
            <p className="text-indigo-100">
              {email || 'No email set'} · Member since {memberSinceLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile?.role === 'admin' && (
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                  🛡️ Admin
                </span>
              )}
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                ✓ {provider === 'google' ? 'Google' : 'Email'} verified
              </span>
              {mobile && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                  📱 {mobile}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <PackageIcon className="h-5 w-5" size={20} />
            <div className="mt-1 text-2xl font-bold">{orders.length}</div>
            <div className="text-xs text-indigo-100">Orders</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <HeartIcon className="h-5 w-5" size={20} />
            <div className="mt-1 text-2xl font-bold">{wishlist.length}</div>
            <div className="text-xs text-indigo-100">Wishlist</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <StoreIcon className="h-5 w-5" size={20} />
            <div className="mt-1 text-2xl font-bold">{allMyListings.length}</div>
            <div className="text-xs text-indigo-100">Listings</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <UserIcon className="h-5 w-5" size={20} />
            <div className="mt-1 text-2xl font-bold">
              {profile?.role === 'admin' ? '4.9' : '—'}
            </div>
            <div className="text-xs text-indigo-100">Seller rating</div>
          </div>
        </div>
      </div>

      {/* =================== TABS =================== */}
      <div className="mt-6 flex gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800 sm:max-w-md">
        {[
          { id: 'orders' as const, label: 'Orders' },
          { id: 'listings' as const, label: 'Listings' },
          { id: 'profile' as const, label: 'Profile' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* =================== ORDERS TAB =================== */}
        {tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                <PackageIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" size={48} />
                <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">No orders yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Start shopping to see your orders here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{o.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Placed on {new Date(o.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            o.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : o.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}
                        >
                          {o.status}
                        </span>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatLKR(o.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {o.items.map((item) => (
                        <div key={item.product.id} className="flex gap-3 p-4">
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/60/4f46e5/ffffff?text=•`;
                            }}
                          />
                          <div className="flex-1 text-sm">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatLKR(item.product.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== LISTINGS TAB =================== */}
        {tab === 'listings' && (
          <div>
            {allMyListings.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-slate-500 dark:text-slate-400">
                  You haven't created any listings yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allMyListings.map((l) => (
                  <div
                    key={l.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  >
                    <img
                      src={l.image}
                      alt={l.name}
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/400x225/4f46e5/ffffff?text=${encodeURIComponent(l.name)}`;
                      }}
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{l.name}</h3>
                      <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatLKR(l.price)}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" size={12} /> {l.date}
                        </span>
                        <button
                          onClick={() => l.id && handleRemoveListing(l.id)}
                          className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== PROFILE TAB =================== */}
        {tab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}

/**
 * Sub-component: editable profile form. Reads initial values from the
 * Realtime DB profile and writes changes back via AuthContext.updateProfile.
 */
function ProfileTab() {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [mobile, setMobile] = useState(profile?.mobile || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Re-sync local state whenever the live profile changes
  useEffect(() => {
    setName(profile?.displayName || user?.displayName || '');
    setMobile(profile?.mobile || '');
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'err', text: 'Name cannot be empty.' });
      return;
    }
    if (mobile && !/^[\d+\-\s()]{7,20}$/.test(mobile.trim())) {
      setMessage({ type: 'err', text: 'Please enter a valid mobile number.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        displayName: name.trim(),
        mobile: mobile.trim(),
      });
      await refreshProfile();
      setMessage({ type: 'ok', text: '✅ Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'err', text: err?.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h2>
        <button
          type="button"
          onClick={() => refreshProfile()}
          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Read-only fields sourced from the database */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">User ID</label>
          <input
            readOnly
            value={user?.uid || ''}
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Email <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">locked</span>
          </label>
          <input
            readOnly
            value={profile?.email || user?.email || ''}
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
          />
        </div>
      </div>

      {/* Editable fields */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Full name <span className="text-rose-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Mobile number
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+94 75 123 4567"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Last updated:{' '}
          {profile?.lastLoginAt
            ? new Date(profile.lastLoginAt as number).toLocaleString()
            : '—'}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
