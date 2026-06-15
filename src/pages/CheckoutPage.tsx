import { useState } from 'react';
import { useAppStore, Order } from '../store/appStore';
import { useAuth } from '../lib/AuthContext';
import { createOrder } from '../lib/firebaseServices';
import { formatLKR } from '../lib/format';
import { ArrowLeftIcon, CheckIcon, CreditCardIcon, MapPinIcon, ShieldIcon } from '../components/Icons';

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const cart = useAppStore((s) => s.cart);
  const addOrder = useAppStore((s) => s.addOrder);
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderId, setOrderId] = useState('');
  const [placing, setPlacing] = useState(false);

  const [form, setForm] = useState({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    address: '123 Tech Avenue',
    city: 'San Francisco',
    zip: '94105',
    country: 'United States',
    payment: 'card',
    cardNumber: '4242 4242 4242 4242',
    cardName: 'Alex Johnson',
    cardExpiry: '12/28',
    cardCvv: '123',
  });

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">No items to checkout</h2>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
        >
          Browse products
        </button>
      </div>
    );
  }

  const placeOrder = async () => {
    setPlacing(true);
    const order: Order = {
      id: 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      items: cart,
      total,
      date: new Date().toISOString(),
      status: 'Processing',
      shippingAddress: {
        name: form.name,
        address: form.address,
        city: form.city,
        zip: form.zip,
      },
      paymentMethod: form.payment === 'card' ? `Card ending ${form.cardNumber.slice(-4)}` : 'PayPal',
    };
    addOrder(order);
    // Persist to Firestore if signed in
    if (user) {
      try {
        await createOrder(order, user.uid);
      } catch (err) {
        console.error('Failed to save order to Firestore:', err);
      }
    }
    setOrderId(order.id);
    setStep(3);
    setPlacing(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        onClick={() => onNavigate('cart')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" size={16} /> Back to cart
      </button>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Checkout</h1>

      {step < 3 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {[
            { n: 1, label: 'Shipping' },
            { n: 2, label: 'Payment' },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step >= s.n ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.n ? <CheckIcon className="h-4 w-4" size={16} /> : s.n}
              </div>
              <span
                className={`font-medium ${
                  step >= s.n ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {s.n < 2 && <div className="mx-2 h-px w-8 bg-slate-300" />}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {step === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-indigo-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Shipping address</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">ZIP code</label>
                  <input
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <CreditCardIcon className="h-5 w-5 text-indigo-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Payment method</h2>
              </div>
              <div className="mb-5 grid grid-cols-3 gap-2">
                {['card', 'paypal', 'apple'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setForm({ ...form, payment: p })}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold capitalize transition ${
                      form.payment === p
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {p === 'card' ? '💳 Card' : p === 'paypal' ? '🅿️ PayPal' : '🍎 Apple Pay'}
                  </button>
                ))}
              </div>

              {form.payment === 'card' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Card number</label>
                    <input
                      value={form.cardNumber}
                      onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Name on card</label>
                    <input
                      value={form.cardName}
                      onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Expiry (MM/YY)</label>
                    <input
                      value={form.cardExpiry}
                      onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">CVV</label>
                    <input
                      value={form.cardCvv}
                      onChange={(e) => setForm({ ...form, cardCvv: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {form.payment === 'paypal' && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
                  You'll be redirected to PayPal to complete your purchase securely.
                </div>
              )}

              {form.payment === 'apple' && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
                  Confirm with Touch ID or Face ID on your Apple device to complete the purchase.
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {placing ? 'Placing order…' : `Place Order · ${formatLKR(total)}`}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldIcon className="h-3.5 w-3.5" size={14} />
                Your payment is encrypted and secure
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckIcon className="h-10 w-10" size={40} />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Order confirmed!</h2>
              <p className="mt-2 text-slate-600">
                Thank you for your purchase. Your order{' '}
                <span className="font-semibold text-slate-900">{orderId}</span> has been received.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                A confirmation email has been sent to {form.email}.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={() => onNavigate('account')}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
                >
                  View my orders
                </button>
                <button
                  onClick={() => onNavigate('shop')}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">Order summary</h3>
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/60/4f46e5/ffffff?text=•`;
                      }}
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatLKR(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd>{formatLKR(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? 'Free' : formatLKR(shipping)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Tax</dt>
                  <dd>{formatLKR(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <dt>Total</dt>
                  <dd>{formatLKR(total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
