import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../lib/AuthContext';
import {
  createListing,
  deleteListing,
  subscribeToListings,
} from '../lib/firebaseServices';
import { categories, Listing } from '../data/products';
import { formatLKR } from '../lib/format';
import { MultiImageUploader } from '../components/MultiImageUploader';
import { ConfirmModal } from '../components/ConfirmModal';

export function SellPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const addListing = useAppStore((s) => s.addListing);
  const removeListing = useAppStore((s) => s.removeListing);
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // Pending deletion target — when set, the confirm modal is open
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Live-subscribe to ALL listings in the database, then filter by seller.
  // The "My Listings" tab uses the database directly, not the local store,
  // so deletions are guaranteed to remove from the database.
  useEffect(() => {
    if (!user) {
      setDbListings([]);
      return;
    }
    const unsubscribe = subscribeToListings((items) => {
      // Show only this admin's listings, newest first
      const mine = items
        .filter((l) => l.sellerId === user.uid)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setDbListings(mine);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

  const [form, setForm] = useState({
    name: '',
    category: 'smartphones',
    price: '',
    stock: '1',
    condition: 'New' as Listing['condition'],
    description: '',
    images: [] as string[],
    discountPercent: '0',
  });

  // Computed values for live preview
  const basePrice = Number(form.price) || 0;
  const discountPct = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const discountedPrice = basePrice * (1 - discountPct / 100);
  const originalPrice = discountPct > 0 ? basePrice : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Publish clicked. User:', user?.uid, 'Images:', form.images.length, 'Name:', form.name);
    if (form.images.length === 0) {
      setSubmitError('Please upload at least one image for your product.');
      return;
    }
    if (!form.name.trim()) {
      setSubmitError('Please enter a product name.');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setSubmitError('Please enter a valid price.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const coverImage = form.images[0];
    const sellerId = user?.uid || 'guest-' + Date.now();
    const sellerName = user?.displayName || user?.email || 'Guest Seller';
    const finalPrice = basePrice * (1 - discountPct / 100);
    const finalOriginalPrice = discountPct > 0 ? basePrice : undefined;
    // Note: id is intentionally omitted — the database will assign one.
    // We update it after createListing() returns the real push ID.
    const listing: Listing = {
      name: form.name,
      category: form.category,
      price: finalPrice, // Final price after discount
      originalPrice: finalOriginalPrice, // Pre-discount price (for the strikethrough)
      stock: Number(form.stock),
      condition: form.condition,
      description: form.description,
      image: coverImage,
      images: form.images,
      status: 'Active',
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      console.log('Publishing listing...', {
        sellerId,
        imageCount: form.images.length,
        totalSize: form.images.reduce((s, u) => s + u.length, 0),
        discountPct,
      });
      // 30s safety timeout (compressed images should be small)
      const publishPromise = createListing({
        ...listing,
        discountPercent: discountPct,
        sellerId,
        sellerName,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Publish timed out — image data may be too large. Try smaller images.')), 30000)
      );
      const dbPushId = await Promise.race([publishPromise, timeoutPromise]);
      console.log('Listing published successfully! dbId:', dbPushId);

      // Add to local store (using the database push ID) for instant UI feedback
      addListing({ ...listing, id: dbPushId });
      setSubmitted(true);
      setForm({
        name: '',
        category: 'smartphones',
        price: '',
        stock: '1',
        condition: 'New',
        description: '',
        images: [],
        discountPercent: '0',
      });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      console.error('Publish failed:', err);
      setSubmitError(
        err?.message ||
          'Failed to publish. Check that you are signed in and your Realtime Database rules allow writes.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /** User clicked the Delete button on a listing card. */
  const requestRemove = (id: string, name: string) => {
    setPendingDelete({ id, name });
  };

  /** Called from the confirm modal after the user clicks "Yes, delete". */
  const confirmRemove = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);

    setRemovingId(id);
    setSubmitError('');
    try {
      console.log('Deleting listing from database:', id);
      // Delete from the Realtime Database first (this is the source of truth)
      await deleteListing(id);
      // The onValue subscription will auto-remove it from dbListings
      console.log('Listing deleted successfully:', name);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setSubmitError(
        err?.message ||
          'Failed to delete the listing. This is usually a database rule issue.'
      );
    } finally {
      setRemovingId(null);
      removeListing(id); // also clear from local cache if present
    }
  };

  // Gate: must be signed in AND must be an admin to access this page
  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="text-6xl">🔒</div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Sign in required</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          You must be signed in to access the seller dashboard.
        </p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          Click the "Account" button in the header to sign in.
        </p>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="text-6xl">⛔</div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Admins only</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The seller dashboard is restricted to administrators.
        </p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          You're signed in as <span className="font-semibold">{user.email}</span>, which does not
          have admin privileges.
        </p>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          If you believe you should have access, contact the site administrator and ask to be added
          to the admin list.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          Sell on ElectroHub
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          🛡️ Admin
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        List your electronics and reach 50,000+ buyers worldwide.
      </p>

      <div className="mt-8 flex gap-2 rounded-full bg-slate-100 p-1 sm:max-w-md">
        {(['create', 'manage'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              activeTab === t
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'create' ? 'New Listing' : `My Listings (${dbListings.length})`}
          </button>
        ))}
      </div>

      {!user && activeTab === 'create' && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          ⚠️ You're not signed in. <strong>You must sign in first</strong> to publish a listing. Click the
          "Account" button in the top-right corner.
        </div>
      )}

      {activeTab === 'create' && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <strong>Form status:</strong> Signed in: {user ? '✅ Yes' : '❌ No'} · Photos:{' '}
          {form.images.length} · Name: {form.name || '(empty)'} · Price: {form.price || '(empty)'}
        </div>
      )}

      {submitError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="font-semibold">⚠️ Could not publish:</div>
          <div className="mt-1">{submitError}</div>
          {submitError.includes('rules') || submitError.includes('permission') ? (
            <div className="mt-2 text-xs">
              👉 <strong>Fix:</strong> Go to Firebase Console → Realtime Database → Rules, and set them to:
              <pre className="mt-2 overflow-x-auto rounded bg-rose-100 p-2 text-[10px] dark:bg-rose-900/30">
{`{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}`}
              </pre>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="mt-6 grid gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Product details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Provide clear info to help your item sell faster.
            </p>

            {submitError && (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                {submitError}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Product name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. iPhone 14 Pro 128GB"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Condition *</label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value as Listing['condition'] })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option>New</option>
                  <option>Refurbished</option>
                  <option>Used</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Price (LKR) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="299"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Offer / Discount %
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountPercent: Math.min(
                          99,
                          Math.max(0, Number(e.target.value) || 0)
                        ).toString(),
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-sm outline-none focus:border-indigo-500"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* Live offer preview */}
              {basePrice > 0 && discountPct > 0 && (
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="text-base">🏷️</span>
                    <span className="font-medium">Offer preview:</span>
                    <span className="font-semibold">{formatLKR(discountedPrice)}</span>
                    <span className="text-slate-400 line-through">
                      {formatLKR(basePrice)}
                    </span>
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                      -{discountPct}%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600">Stock quantity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <MultiImageUploader
                  label="Product photos *"
                  values={form.images}
                  onChange={(urls) => setForm({ ...form, images: urls })}
                  maxImages={6}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe condition, included accessories, warranty..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {submitting
                ? 'Publishing…'
                : submitted
                ? '✓ Listing published!'
                : 'Publish listing'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="mt-6">
          {dbListings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                No listings yet. Create your first one!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dbListings.map((l) => (
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
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          l.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : l.status === 'Sold'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}
                      >
                        {l.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {l.date}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {l.name}
                    </h3>
                    <div className="mt-1 text-xs text-slate-500 capitalize dark:text-slate-400">
                      {l.category} · {l.condition} · Stock: {l.stock}
                    </div>
                    {l.discountPercent && l.discountPercent > 0 ? (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatLKR(l.price)}
                        </span>
                        {l.originalPrice && (
                          <span className="text-slate-400 line-through">
                            {formatLKR(l.originalPrice)}
                          </span>
                        )}
                        <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                          -{l.discountPercent}%
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatLKR(l.price)}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      {l.discountPercent && l.discountPercent > 0 ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          final price
                        </div>
                      ) : (
                        <div />
                      )}
                      <button
                        onClick={() => l.id && requestRemove(l.id, l.name)}
                        disabled={removingId === l.id}
                        className="flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      >
                        {removingId === l.id ? (
                          <>⏳ Deleting…</>
                        ) : (
                          <>✕ Delete</>
                        )}
                      </button>
                    </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* =============== Confirm-delete modal =============== */}
      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this listing?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from the database. This action cannot be undone.`
            : ''
        }
        confirmText="Yes, delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
