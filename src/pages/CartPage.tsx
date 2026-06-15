import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { formatLKR } from '../lib/format';
import { ArrowLeftIcon, MinusIcon, PlusIcon, ShieldIcon, TruckIcon, TrashIcon } from '../components/Icons';

interface CartPageProps {
  onNavigate: (page: string) => void;
}

export function CartPage({ onNavigate }: CartPageProps) {
  const cart = useAppStore((s) => s.cart);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  // Free shipping on orders over Rs. 5,000 (or empty cart)
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 500;
  const couponDiscount = couponApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - couponDiscount) * 0.08;
  const total = subtotal - couponDiscount + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="text-6xl">🛒</div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Looks like you haven't added anything yet.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Browse products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        onClick={() => onNavigate('shop')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" size={16} /> Continue shopping
      </button>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {cart.length} item(s) in your cart
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/100/4f46e5/ffffff?text=${item.product.brand}`;
                }}
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {item.product.brand}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                      {item.product.name}
                    </h3>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Condition: {item.product.condition}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    aria-label="Remove"
                  >
                    <TrashIcon className="h-4 w-4" size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-700">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <MinusIcon className="h-3 w-3" size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <PlusIcon className="h-3 w-3" size={12} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {formatLKR(item.product.price * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatLKR(item.product.price)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Order Summary</h3>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code (try SAVE10)"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => {
                  if (coupon.toUpperCase() === 'SAVE10') {
                    setCouponApplied(true);
                  }
                }}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">✓ 10% discount applied!</div>
            )}

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Subtotal</dt>
                <dd>{formatLKR(subtotal)}</dd>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <dt>Discount</dt>
                  <dd>-{formatLKR(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? 'Free' : formatLKR(shipping)}</dd>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <dt>Tax (8%)</dt>
                <dd>{formatLKR(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                <dt>Total</dt>
                <dd>{formatLKR(total)}</dd>
              </div>
            </dl>

            <button
              onClick={() => onNavigate('checkout')}
              className="mt-5 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Proceed to Checkout
            </button>

            <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-3.5 w-3.5" size={14} /> Free shipping on orders over Rs. 5,000
              </div>
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-3.5 w-3.5" size={14} /> Secure 256-bit SSL checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
