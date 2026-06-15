export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  condition: 'New' | 'Refurbished' | 'Used';
  description: string;
  specs: { label: string; value: string }[];
  images: string[];
  seller: string;
  sellerRating: number;
  shipping: number;
}

export const categories = [
  { id: 'all', name: 'All Electronics', icon: '🛍️' },
  { id: 'smartphones', name: 'Smartphones', icon: '📱' },
  { id: 'laptops', name: 'Laptops', icon: '💻' },
  { id: 'tablets', name: 'Tablets', icon: '📲' },
  { id: 'audio', name: 'Audio', icon: '🎧' },
  { id: 'tvs', name: 'TVs & Displays', icon: '📺' },
  { id: 'cameras', name: 'Cameras', icon: '📷' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'wearables', name: 'Wearables', icon: '⌚' },
  { id: 'accessories', name: 'Accessories', icon: '🔌' },
];

/**
 * The built-in products array is now empty.
 * All products shown in the app come exclusively from the Firebase Realtime
 * Database via subscribeToListings() and are converted to Product objects
 * using listingToProduct() below.
 */
export const products: Product[] = [];

/**
 * Allowed brand filter values (used by the Shop sidebar filter).
 * Empty by default — sellers can enter any brand when creating a listing.
 * Keeping this list as UI metadata only, not as a source of listings.
 */
export const brands: string[] = [];

export interface Listing {
  id?: string; // assigned by the database on creation
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  condition: 'New' | 'Refurbished' | 'Used';
  description: string;
  image: string;
  images?: string[];
  status: 'Active' | 'Sold' | 'Draft';
  date: string;
  discountPercent?: number;
  createdAt?: number;
  sellerId?: string;
  sellerName?: string;
}

/**
 * Convert a database listing into a Product for display in the catalog.
 * No fake/sample data is used — everything comes from the listing itself.
 * If the listing has a discountPercent, the original (pre-discount) price
 * is shown alongside the final price with a strikethrough.
 */
export function listingToProduct(l: Listing): Product {
  return {
    id: 'listing-' + l.id,
    name: l.name,
    brand: 'Community Seller',
    category: l.category,
    price: l.price,
    originalPrice: l.originalPrice,
    rating: 4.5,
    reviews: 0,
    stock: l.stock,
    condition: l.condition,
    description: l.description,
    specs: [
      { label: 'Condition', value: l.condition },
      { label: 'Category', value: l.category },
      { label: 'Stock', value: String(l.stock) },
      { label: 'Listed', value: l.date },
      { label: 'Seller', value: 'Community Seller' },
      ...(l.discountPercent && l.discountPercent > 0
        ? [{ label: 'Discount', value: `${l.discountPercent}% off` }]
        : []),
    ],
    images: l.images && l.images.length > 0 ? l.images : [l.image],
    seller: 'Community Seller',
    sellerRating: 4.5,
    shipping: 0,
  };
}
