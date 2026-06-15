import { collection, getDocs } from 'firebase/firestore';
import {
  ref,
  push,
  set,
  remove,
  onValue,
  get,
  update,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, rtdb, storage, FIREBASE_STORAGE_ENABLED } from './firebase';
import { Product } from '../data/products';
import { Order, CartItem } from '../store/appStore';

// =============== FIRESTORE: Products ===============

export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

// =============== REALTIME DB: User Profiles ===============

export interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  mobile: string;
  photoURL: string;
  provider: 'email' | 'google';
  role: 'admin' | 'user';
  createdAt: number;
  lastLoginAt: number;
  listingsCount?: number;
  ordersCount?: number;
  totalSpent?: number;
}

/**
 * Save (create or update) a user profile in Realtime Database at /users/{uid}
 * This is what shows up at https://mobile-expert-3d12a-default-rtdb.firebaseio.com/
 */
export async function saveUserProfileToRTDB(
  uid: string,
  data: {
    email: string;
    displayName: string;
    mobile?: string;
    photoURL: string;
    provider: 'email' | 'google';
    role: 'admin' | 'user';
  }
): Promise<UserProfileDoc> {
  const userRef = ref(rtdb, `users/${uid}`);
  const snap = await get(userRef);
  const existing = snap.val() as UserProfileDoc | null;

  const profile: UserProfileDoc = {
    uid,
    email: data.email,
    displayName: data.displayName,
    mobile: data.mobile ?? existing?.mobile ?? '',
    photoURL: data.photoURL,
    provider: data.provider,
    role: (existing?.role as 'admin' | 'user' | undefined) ?? data.role,
    createdAt: existing?.createdAt ?? Date.now(),
    lastLoginAt: Date.now(),
    listingsCount: existing?.listingsCount ?? 0,
    ordersCount: existing?.ordersCount ?? 0,
    totalSpent: existing?.totalSpent ?? 0,
  };

  await set(userRef, stripUndefined(profile));
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const snap = await get(ref(rtdb, `users/${uid}`));
  if (!snap.exists()) return null;
  return snap.val() as UserProfileDoc;
}

/**
 * Update editable fields on the user's profile document.
 * Only the provided fields are touched.
 */
export async function updateUserProfile(
  uid: string,
  fields: Partial<Pick<UserProfileDoc, 'displayName' | 'mobile' | 'photoURL'>>
): Promise<void> {
  try {
    await update(
      ref(rtdb, `users/${uid}`),
      stripUndefined({
        ...fields,
        lastLoginAt: Date.now(),
      })
    );
  } catch (err) {
    console.error('Failed to update user profile:', err);
    throw err;
  }
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfileDoc | null) => void
) {
  const userRef = ref(rtdb, `users/${uid}`);
  return onValue(userRef, (snap) => {
    callback(snap.exists() ? (snap.val() as UserProfileDoc) : null);
  });
}

/** Increment a counter on the user profile atomically using RTDB. */
export async function incrementUserStat(
  uid: string,
  field: 'listingsCount' | 'ordersCount' | 'totalSpent',
  delta: number
) {
  try {
    const userRef = ref(rtdb, `users/${uid}/${field}`);
    const snap = await get(userRef);
    const current = (snap.val() as number) || 0;
    await update(ref(rtdb, `users/${uid}`), {
      [field]: current + delta,
    });
  } catch (err) {
    console.warn('Failed to update user stat:', err);
  }
}

// =============== REALTIME DB: Listings (user-listed items) ===============

export interface FirestoreListing {
  id?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  condition: 'New' | 'Refurbished' | 'Used';
  description: string;
  image: string; // cover image (first image)
  images?: string[]; // all uploaded images (up to 6)
  status: 'Active' | 'Sold' | 'Draft';
  date: string;
  sellerId: string;
  sellerName: string;
  brand?: string;
  discountPercent?: number;
  createdAt?: number;
}

/**
 * Create a new listing in Realtime DB at /listings/{pushId}.
 * The push ID is also written into the data so that client-side code can
 * always use the real database key (not a fake local one).
 */
/**
 * Create a new listing in Realtime DB at /listings/{pushId}.
 * The push ID is also written into the data so client-side code can
 * always use the real database key (not a fake local one).
 *
 * IMPORTANT: Firebase Realtime Database rejects `undefined` values, so
 * we strip them out before writing. This is what enables the discount
 * field to be optional (omitted entirely when there's no offer).
 */
export async function createListing(listing: FirestoreListing): Promise<string> {
  const newRef = push(ref(rtdb, 'listings'));
  const id = newRef.key!;
  const data = stripUndefined({
    ...listing,
    id,
    createdAt: Date.now(),
  });
  await set(newRef, data);
  return id;
}

/**
 * Recursively strip `undefined` values from an object so it can be safely
 * written to Firebase Realtime Database (which rejects undefined).
 */
function stripUndefined<T = unknown>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) =>
      v === undefined ? null : stripUndefined(v)
    ) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return obj;
}

export async function updateListing(id: string, data: Partial<FirestoreListing>) {
  await update(ref(rtdb, `listings/${id}`), stripUndefined(data));
}

export async function deleteListing(id: string) {
  await remove(ref(rtdb, `listings/${id}`));
}

export function subscribeToListings(
  callback: (listings: (FirestoreListing & { id: string })[]) => void,
  sellerId?: string
) {
  const listingsRef = ref(rtdb, 'listings');
  return onValue(listingsRef, (snap) => {
    const val = snap.val() as Record<string, FirestoreListing> | null;
    if (!val) {
      callback([]);
      return;
    }
    let items = Object.entries(val).map(([key, data]) => {
      // CRITICAL: Use the database KEY as the id, not the data.id field.
      // The data.id may be a local timestamp (from old listings) but the
      // database key is the only way to reliably delete the record.
      return {
        ...data,
        id: key, // Always use the database key for delete operations
      };
    });
    if (sellerId) items = items.filter((l) => l.sellerId === sellerId);
    // Sort by createdAt desc
    items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    callback(items);
  });
}

// =============== REALTIME DB: Orders ===============

/** Create a new order in Realtime DB at /orders/{pushId} */
export async function createOrder(
  order: Omit<Order, 'id'>,
  userId: string
): Promise<string> {
  const newRef = push(ref(rtdb, 'orders'));
  const data = stripUndefined({ ...order, userId, createdAt: Date.now() });
  await set(newRef, data);
  return newRef.key!;
}

export function subscribeToOrders(
  userId: string,
  callback: (orders: (Order & { id: string })[]) => void
) {
  const ordersRef = ref(rtdb, 'orders');
  return onValue(ordersRef, (snap) => {
    const val = snap.val() as Record<string, Order & { userId: string }> | null;
    if (!val) {
      callback([]);
      return;
    }
    const items = Object.entries(val)
      .filter(([, o]) => o.userId === userId)
      .map(([key, data]) => ({ ...data, id: key } as Order & { id: string }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(items);
  });
}

// =============== REALTIME DB: Cart ===============

export interface RealtimeCartItem extends CartItem {
  addedAt: number;
}

export function pushToRealtimeCart(userId: string, item: CartItem) {
  const newRef = push(ref(rtdb, `carts/${userId}`));
  return set(newRef, { ...item, addedAt: Date.now() });
}

export function subscribeToRealtimeCart(
  userId: string,
  callback: (items: (CartItem & { key: string })[]) => void
) {
  const cartRef = ref(rtdb, `carts/${userId}`);
  return onValue(cartRef, (snap) => {
    const val = snap.val() as Record<string, CartItem> | null;
    if (!val) {
      callback([]);
      return;
    }
    const items = Object.entries(val).map(([key, value]) => ({
      ...value,
      key,
    }));
    callback(items);
  });
}

export function removeFromRealtimeCart(userId: string, key: string) {
  return remove(ref(rtdb, `carts/${userId}/${key}`));
}

export function clearRealtimeCart(userId: string) {
  return remove(ref(rtdb, `carts/${userId}`));
}

// =============== REALTIME DB: Wishlist ===============

export function pushToRealtimeWishlist(userId: string, productId: string) {
  const newRef = push(ref(rtdb, `wishlists/${userId}`));
  return set(newRef, { productId, addedAt: Date.now() });
}

export function subscribeToRealtimeWishlist(
  userId: string,
  callback: (productIds: string[]) => void
) {
  const wishRef = ref(rtdb, `wishlists/${userId}`);
  return onValue(wishRef, (snap) => {
    const val = snap.val() as Record<string, { productId: string }> | null;
    if (!val) {
      callback([]);
      return;
    }
    const ids = Object.values(val).map((v) => v.productId);
    callback(ids);
  });
}

export function removeFromRealtimeWishlist(userId: string, productId: string) {
  return remove(ref(rtdb, `wishlists/${userId}/${productId}`));
}

// =============== STORAGE: Image Upload ===============

export interface UploadResult {
  url: string;
  path: string;
  isLocal: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Compress an image to a maximum width and JPEG quality, returning a data URL.
 * This keeps Realtime Database writes small enough to avoid timeouts.
 */
function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image'));
      return;
    }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        try {
          // Skip compression for small images or SVGs
          if (file.size < 200 * 1024 || file.type === 'image/svg+xml') {
            resolve(e.target?.result as string);
            return;
          }
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Always output JPEG for compression
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          // If compressed is bigger than original, use original
          if (dataUrl.length > (e.target?.result as string).length) {
            resolve(e.target?.result as string);
          } else {
            resolve(dataUrl);
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file. Tries Firebase Storage first (5s timeout), then
 * falls back to a local data URL if Storage is unavailable.
 */
export async function uploadImage(
  file: File,
  userId?: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload JPG, PNG, WEBP, or GIF.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  // Local fallback function (always available)
  // Also compresses the image to keep the data URL small for Realtime DB
  const uploadLocal = (): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      compressImage(file, 1200, 0.7)
        .then((dataUrl) => {
          if (onProgress) onProgress(100);
          resolve({
            url: dataUrl,
            path: `local/${file.name}`,
            isLocal: true,
          });
        })
        .catch((err) => {
          // Fallback to original if compression fails
          const reader = new FileReader();
          reader.onload = () => {
            if (onProgress) onProgress(100);
            resolve({
              url: reader.result as string,
              path: `local/${file.name}`,
              isLocal: true,
            });
          };
          reader.onerror = () => reject(err || new Error('Failed to read file.'));
          if (onProgress) onProgress(50);
          reader.readAsDataURL(file);
        });
    });
  };

  // Try Firebase Storage first (requires authenticated user + Storage enabled in Firebase Console)
  if (userId && FIREBASE_STORAGE_ENABLED) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `listings/${userId}/${filename}`;
      const fileRef = storageRef(storage, path);

      if (onProgress) onProgress(10);

      // Short 5s timeout - if Storage is broken, fail fast and use local
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 5000)
      );

      const uploadPromise = (async () => {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      })();

      const url = await Promise.race([uploadPromise, timeoutPromise]);
      if (onProgress) onProgress(100);
      return { url, path, isLocal: false };
    } catch (err: any) {
      // Storage failed - silently fall back to local
      console.info(
        'Firebase Storage unavailable, using local data URL:',
        err?.message || err
      );
    }
  } else if (userId) {
    // Storage disabled by config - go straight to local without trying
    console.info('Firebase Storage disabled in config, using local data URL');
  }

  // Fall through to local data URL
  return uploadLocal();
}

/**
 * Delete an image from Firebase Storage (best-effort, ignores local URLs).
 */
export async function deleteImage(path: string, url: string): Promise<void> {
  if (url.startsWith('data:') || path.startsWith('local/')) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch (err) {
    console.warn('Failed to delete image:', err);
  }
}
