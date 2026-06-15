import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Listing } from '../data/products';

export type { Listing };

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zip: string;
  };
  paymentMethod: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

interface AppState {
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  listings: Listing[];
  searchQuery: string;
  theme: ThemeMode;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  addOrder: (order: Order) => void;
  addListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => void;
}

/**
 * Detect whether the user's device prefers dark mode.
 * Returns 'dark' if the OS is set to dark, 'light' otherwise.
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the effective theme to apply: if the user chose 'auto', fall back
 * to the device's system preference. Otherwise use the explicit choice.
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') return getSystemTheme();
  return mode;
}

/**
 * Listings are stored in Firebase Realtime Database and synced into the
 * local store via subscribeToListings() (in lib/firebaseServices.ts).
 * The store starts EMPTY — only real database listings appear in the app.
 */

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      orders: [],
      listings: [],
      searchQuery: '',
      // Default to 'auto' so the app follows the device's system theme
      theme: 'auto',
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((c) => c.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.product.id === product.id ? { ...c, quantity: c.quantity + quantity } : c
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((c) => c.product.id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart
            .map((c) => (c.product.id === productId ? { ...c, quantity } : c))
            .filter((c) => c.quantity > 0),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders], cart: [] })),
      addListing: (listing) => set((state) => ({ listings: [listing, ...state.listings] })),
      removeListing: (id) =>
        set((state) => ({ listings: state.listings.filter((l) => l.id !== id) })),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setTheme: (mode) => set({ theme: mode }),
      // Cycle through auto → light → dark → auto on each click
      cycleTheme: () =>
        set((state) => ({
          theme:
            state.theme === 'auto'
              ? 'light'
              : state.theme === 'light'
              ? 'dark'
              : 'auto',
        })),
    }),
    { name: 'electronics-marketplace' }
  )
);
