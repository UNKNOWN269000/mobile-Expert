import { useEffect, useState } from 'react';
import { Product, listingToProduct, Listing } from '../data/products';
import { useAppStore } from '../store/appStore';
import { ProductCard } from '../components/ProductCard';
import { HeartIcon } from '../components/Icons';
import { subscribeToListings } from '../lib/firebaseServices';

interface WishlistPageProps {
  onView: (product: Product) => void;
  onNavigate: (page: string) => void;
}

export function WishlistPage({ onView, onNavigate }: WishlistPageProps) {
  const wishlist = useAppStore((s) => s.wishlist);
  const [listings, setListings] = useState<Listing[]>([]);

  // Subscribe to real database listings
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

  // Match wishlist IDs against real database listings
  const items: Product[] = listings
    .filter((l) => wishlist.includes('listing-' + l.id))
    .map(listingToProduct);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <HeartIcon className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" size={64} />
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Your wishlist is empty</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Save items you love for later.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Discover products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">My Wishlist</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{items.length} item(s) saved</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} onView={onView} />
        ))}
      </div>
    </div>
  );
}
