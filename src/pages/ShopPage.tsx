import { useMemo, useState, useEffect } from 'react';
import {
  categories,
  brands,
  Product,
  listingToProduct,
} from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useAppStore } from '../store/appStore';
import { FilterIcon, StarIcon } from '../components/Icons';

interface ShopPageProps {
  onView: (product: Product) => void;
  initialCategory?: string;
}

const sortOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'reviews', label: 'Most Reviews' },
];

export function ShopPage({ onView, initialCategory = 'all' }: ShopPageProps) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const [dbListings, setDbListings] = useState<import('../data/products').Listing[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  // Default cap in LKR (Sri Lankan Rupees). Was 3000 (USD), bumped to 500,000 LKR.
  const [priceRange, setPriceRange] = useState<number>(500000);
  const [minRating, setMinRating] = useState(0);
  const [conditions, setConditions] = useState<string[]>(['New', 'Refurbished', 'Used']);
  const [sort, setSort] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [showCommunityOnly, setShowCommunityOnly] = useState(false);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Live-subscribe to all listings in the Realtime Database.
  // The store's local listings are used as a quick cache, but the DB is the source of truth.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const { subscribeToListings } = await import('../lib/firebaseServices');
      unsubscribe = subscribeToListings((items) => {
        setDbListings(items);
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Only show listings that are actually in the database.
  // No built-in sample products — 100% database-driven.
  const allProducts: Product[] = useMemo(() => {
    return dbListings
      .filter((l) => l.status === 'Active')
      .map(listingToProduct);
  }, [dbListings]);

  const filtered = useMemo(() => {
    let result = allProducts;
    if (category !== 'all') result = result.filter((p) => p.category === category);
    if (selectedBrands.length) result = result.filter((p) => selectedBrands.includes(p.brand));
    if (showCommunityOnly) result = result.filter((p) => p.id.startsWith('listing-'));
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      // Match against multiple fields for a better search experience.
      // Words are split so "iphone apple" matches a product named "Apple iPhone".
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter((p) => {
        const haystack = [
          p.name,
          p.brand,
          p.category,
          p.condition,
          p.description,
          p.seller,
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      });
    }
    result = result.filter((p) => p.price <= priceRange && p.rating >= minRating);
    if (conditions.length) result = result.filter((p) => conditions.includes(p.condition));

    switch (sort) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result = [...result].sort((a, b) => b.reviews - a.reviews);
        break;
    }
    return result;
  }, [category, selectedBrands, priceRange, minRating, conditions, sort, searchQuery, allProducts, showCommunityOnly]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleCondition = (c: string) =>
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {categories.find((c) => c.id === category)?.name ?? 'All Electronics'}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </span>
          {/* Active search query chip */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Searching: <span className="font-bold">"{searchQuery}"</span>
              <button
                onClick={() => useAppStore.getState().setSearchQuery('')}
                className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-500/30"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
          )}
          {dbListings.filter((l) => l.status === 'Active').length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              ✨ {dbListings.filter((l) => l.status === 'Active').length} from community
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          {showFilters && (
            <button
              onClick={() => setShowFilters(false)}
              className="mb-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
            >
              ← Close filters
            </button>
          )}
          <div className="sticky top-20 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Category</h3>
              <div className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition ${
                      category === c.id
                        ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      {c.icon} {c.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {c.id === 'all'
                        ? allProducts.length
                        : allProducts.filter((p) => p.category === c.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Source</h3>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showCommunityOnly}
                  onChange={(e) => setShowCommunityOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Community listings only
              </label>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Brand</h3>
              <div className="space-y-2">
                {brands.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => toggleBrand(b)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Price: {priceRange.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })}
              </h3>
              <input
                type="range"
                min={500}
                max={500000}
                step={1000}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Rs. 500</span>
                <span>Rs. 500,000</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Customer Rating</h3>
              <div className="space-y-2">
                {[4.5, 4, 3.5, 0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition ${
                      minRating === r
                        ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {r === 0 ? (
                      <span>All ratings</span>
                    ) : (
                      <>
                        <span>{r}+</span>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <StarIcon
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i <= r ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                            size={14}
                          />
                        ))}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Condition</h3>
              <div className="space-y-2">
                {['New', 'Refurbished', 'Used'].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={conditions.includes(c)}
                      onChange={() => toggleCondition(c)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setCategory('all');
                setSelectedBrands([]);
                setPriceRange(3000);
                setMinRating(0);
                setConditions(['New', 'Refurbished', 'Used']);
                setShowCommunityOnly(false);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear all filters
            </button>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            >
              <FilterIcon className="h-4 w-4" size={16} />
              Filters
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 px-6 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-5xl">🔍</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No products found'}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? 'Try a different search term, or clear your filters.'
                  : 'Try adjusting your filters.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => useAppStore.getState().setSearchQuery('')}
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Clear search
                  </button>
                )}
                <button
                  onClick={() => {
                    useAppStore.getState().setSearchQuery('');
                    setCategory('all');
                    setSelectedBrands([]);
                    setPriceRange(3000);
                    setMinRating(0);
                    setConditions(['New', 'Refurbished', 'Used']);
                    setShowCommunityOnly(false);
                  }}
                  className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onView={onView} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
