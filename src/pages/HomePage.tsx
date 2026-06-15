import { useEffect, useState } from 'react';
import { Product, categories, listingToProduct, Listing } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { subscribeToListings } from '../lib/firebaseServices';
import { useAuth } from '../lib/AuthContext';
import { ShieldIcon, TagIcon, ZapIcon } from '../components/Icons';

interface HomePageProps {
  onNavigate: (page: string, data?: any) => void;
  onView: (product: Product) => void;
}

export function HomePage({ onNavigate, onView }: HomePageProps) {
  const { isAdmin } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);

  // Live-subscribe to database listings — only real data
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const unsub = subscribeToListings((items) => {
        setListings(items.filter((l) => l.status === 'Active'));
      });
      unsubscribe = typeof unsub === 'function' ? unsub : undefined;
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const dbProducts: Product[] = listings.map(listingToProduct);
  const featured = dbProducts.slice(0, 8);
  const deals = dbProducts.filter((p) => p.originalPrice).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-pink-400 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-indigo-300 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                New: Spring sale up to 30% off
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Mobiles, Accessories
                <br />
                <span className="text-amber-300">& Electronics</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-indigo-100">
                The trusted marketplace for new, refurbished and pre-loved gadgets. From smartphones
                to cameras, gaming consoles to laptops — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('shop')}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-amber-300 hover:text-slate-900"
                >
                  Start Shopping
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('sell')}
                    className="rounded-full border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    List Your Item
                  </button>
                )}
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-indigo-200">Products</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">12K+</div>
                  <div className="text-indigo-200">Sellers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-indigo-200">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rotate-3 rounded-3xl bg-white/10 blur-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=700"
                alt="Electronics"
                className="relative rounded-3xl shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/700x500/4f46e5/ffffff?text=ElectroHub';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {[
              { icon: ShieldIcon, title: 'Genuine Products', sub: '100% authentic' },
              { icon: TagIcon, title: 'Best Prices', sub: 'Unbeatable deals' },
              { icon: ZapIcon, title: 'Wide Selection', sub: 'Mobiles & more' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <b.icon className="h-5 w-5" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Explore our curated electronics catalog</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {categories.slice(1).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('shop', { category: cat.id })}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
            >
              <div className="text-3xl">{cat.icon}</div>
              <div className="text-center text-[11px] font-medium text-slate-700 dark:text-slate-300 sm:text-xs">
                {cat.name}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured products (only when there are real database listings) */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Featured Products</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">From our community of sellers</p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 sm:inline-block"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onView={onView} />
            ))}
          </div>
        </section>
      )}

      {featured.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl">🛍️</div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">No listings yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isAdmin
                ? 'Be the first to list an item for sale!'
                : 'Check back soon — new products are added regularly.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => onNavigate('sell')}
                className="mt-4 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Create the first listing
              </button>
            )}
          </div>
        </section>
      )}

      {/* Deals banner (only when there are discounted listings) */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-8 py-10 text-white sm:px-12 sm:py-14">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  LIMITED TIME
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">Hot Deals This Week</h2>
                <p className="mt-2 max-w-md text-orange-50">
                  Save big on the most-wanted gadgets.
                </p>
              </div>
              <button
                onClick={() => onNavigate('shop')}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-orange-600 shadow-lg transition hover:bg-slate-900 hover:text-white"
              >
                Shop Deals
              </button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} onView={onView} />
            ))}
          </div>
        </section>
      )}

      {/* Shop with confidence */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-indigo-50 p-6 sm:p-10 dark:bg-indigo-500/10">
          <div className="flex flex-col items-center text-center md:flex-row md:items-center md:gap-6 md:text-left">
            <div className="mb-4 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white md:mb-0">
              <ShieldIcon size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Shop with confidence
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Every order is protected by our Buyer Guarantee. Authentic products, easy returns,
                and full refunds if something's off.
              </p>
            </div>
            <div className="mt-4 flex gap-3 md:mt-0 md:flex-shrink-0">
              <div className="rounded-2xl bg-white px-4 py-3 text-center dark:bg-slate-800">
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 sm:text-2xl">
                  30-day
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Returns</div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center dark:bg-slate-800">
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 sm:text-2xl">
                  100%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Authentic</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
