import { Product } from '../data/products';
import { useAppStore } from '../store/appStore';
import { formatLKR } from '../lib/format';
import { HeartIcon, StarIcon } from './Icons';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
  const wishlist = useAppStore((s) => s.wishlist);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const inWishlist = wishlist.includes(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-2xl dark:hover:shadow-indigo-500/10">
      <div
        onClick={() => onView(product)}
        className="relative aspect-square cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/600x600/4f46e5/ffffff?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur transition hover:bg-white"
          aria-label="Add to wishlist"
        >
          <HeartIcon
            className={`h-4 w-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`}
            size={16}
          />
        </button>
        {discount > 0 && (
          <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            -{discount}%
          </div>
        )}
        {product.condition !== 'New' && (
          <div className="absolute bottom-3 left-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow backdrop-blur">
            {product.condition}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {product.brand}
        </div>
        {product.brand === 'Community Seller' && (
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            👤 Community
          </div>
        )}
        <h3
          onClick={() => onView(product)}
          className="line-clamp-2 cursor-pointer text-sm font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
        >
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-xs">
          <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" size={14} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{product.rating}</span>
          <span className="text-slate-400 dark:text-slate-500">
            ({product.reviews.toLocaleString()})
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {formatLKR(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-slate-400 line-through">
                {formatLKR(product.originalPrice)}
              </div>
            )}
          </div>
          <button
            onClick={() => onView(product)}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
