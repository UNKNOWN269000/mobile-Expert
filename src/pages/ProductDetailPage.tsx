import { useEffect, useState } from 'react';
import { Product, listingToProduct, Listing } from '../data/products';
import { useAppStore } from '../store/appStore';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeftIcon, ShieldIcon, StarIcon, TruckIcon } from '../components/Icons';
import { subscribeToListings } from '../lib/firebaseServices';
import { formatLKR } from '../lib/format';
import { buildProductInquiryMessage, openWhatsAppChat } from '../lib/whatsapp';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onView: (product: Product) => void;
}

export function ProductDetailPage({ product, onBack, onView }: ProductDetailPageProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);
  // Keep the wishlist store subscribed so the header badge count stays in sync.
  useAppStore((s) => s.wishlist);

  // Fetch real related products from the database
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const unsub = subscribeToListings((items: Listing[]) => {
        const relatedItems = items
          .filter((l) => l.status === 'Active' && l.category === product.category)
          .map(listingToProduct)
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
        setRelated(relatedItems);
      });
      unsubscribe = typeof unsub === 'function' ? unsub : undefined;
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [product.id, product.category]);

  // Build a product URL that the recipient can open to view the item.
  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#product-${product.id}`
      : '';

  const handleContactSeller = () => {
    const message = buildProductInquiryMessage({
      name: product.name,
      brand: product.brand,
      category: product.category,
      condition: product.condition,
      price: product.price,
      productUrl,
    });
    openWhatsAppChat(message);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" size={16} /> Back to shop
      </button>

      <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl bg-slate-100 sm:rounded-3xl">
            <img
              src={product.images[imageIndex]}
              alt={product.name}
              className="aspect-square w-full max-h-[420px] object-cover sm:max-h-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/800x800/4f46e5/ffffff?text=${encodeURIComponent(product.name)}`;
              }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4 sm:gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`flex-shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition sm:rounded-xl ${
                    imageIndex === i ? 'border-indigo-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/100/4f46e5/ffffff?text=${i + 1}`;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            {product.brand}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                  size={16}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {product.rating}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              ({product.reviews.toLocaleString()} reviews)
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-2 sm:gap-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              {formatLKR(product.price)}
            </div>
            {product.originalPrice && (
              <>
                <div className="text-base text-slate-400 line-through sm:text-lg">
                  {formatLKR(product.originalPrice)}
                </div>
                <div className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 sm:text-sm">
                  Save {formatLKR(product.originalPrice - product.price)}
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            {product.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs sm:gap-4 sm:p-4 sm:text-sm dark:bg-slate-800">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Condition</div>
              <div className="font-semibold text-slate-900 dark:text-white">{product.condition}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Availability</div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                {product.stock > 0 ? `In stock (${product.stock} left)` : 'Out of stock'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Sold by</div>
              <div className="font-semibold text-slate-900 dark:text-white">{product.seller}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Seller rating</div>
              <div className="font-semibold text-amber-600 dark:text-amber-400">
                ⭐ {product.sellerRating}/5
              </div>
            </div>
          </div>

          {/* WhatsApp Chat button — primary CTA */}
          <div className="mt-6">
            <button
              onClick={handleContactSeller}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98] sm:py-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 transition group-hover:scale-110 sm:h-6 sm:w-6"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
              </svg>
              <span>Chat on WhatsApp</span>
            </button>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              💬 Tap to message <span className="font-semibold">+94 77 935 8777</span> on WhatsApp
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
              <TruckIcon className="mt-0.5 h-5 w-5 text-indigo-600" size={20} />
              <div className="text-sm">
                <div className="font-semibold text-slate-900">
                  {product.shipping === 0
                    ? 'Free local delivery'
                    : `${formatLKR(product.shipping)} local delivery`}
                </div>
                <div className="text-slate-500">Available in Kattankudy & nearby</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
              <ShieldIcon className="mt-0.5 h-5 w-5 text-indigo-600" size={20} />
              <div className="text-sm">
                <div className="font-semibold text-slate-900">30-day returns</div>
                <div className="text-slate-500">Buyer protection included</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Specifications</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <tbody>
              {product.specs.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
                  <td className="w-1/3 px-5 py-3 text-sm font-medium text-slate-500">{s.label}</td>
                  <td className="px-5 py-3 text-sm text-slate-900">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviews summary */}
      <div className="mt-12 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-3 sm:p-8">
        <div className="text-center sm:border-r sm:border-slate-200">
          <div className="text-5xl font-bold text-slate-900">{product.rating}</div>
          <div className="mt-2 flex justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon
                key={i}
                className={`h-5 w-5 ${
                  i <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
                size={20}
              />
            ))}
          </div>
          <div className="mt-1 text-sm text-slate-500">{product.reviews.toLocaleString()} reviews</div>
        </div>
        <div className="sm:col-span-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 3 : 1;
            return (
              <div key={star} className="mb-2 flex items-center gap-3 text-sm">
                <div className="w-12 text-slate-600">{star} star</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-10 text-right text-slate-500">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
