import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { SellPage } from './pages/SellPage';
import { AccountPage } from './pages/AccountPage';
import { Product } from './data/products';
import { useAuth } from './lib/AuthContext';
import { PendingAuth } from './lib/pendingAuth';

type Page = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'wishlist' | 'sell' | 'account';

export default function App() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialCategory, setInitialCategory] = useState<string>('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // After a successful sign-in/up, replay the action the user attempted
  // before being asked to authenticate. (e.g. open the product they clicked)
  useEffect(() => {
    if (user) {
      const pending = PendingAuth.consume();
      if (pending) {
        if (pending.action === 'viewProduct' && pending.payload) {
          setSelectedProduct(pending.payload as Product);
          setPage('product');
        }
      }
    }
  }, [user]);

  const handleNavigate = (target: string, data?: any) => {
    if (data?.category) {
      setInitialCategory(data.category);
    }
    if (target === 'product' && data) {
      setSelectedProduct(data as Product);
    }
    setPage(target as Page);
  };

  /**
   * Open a product detail page. If the user isn't signed in, store the
   * requested product in a pending queue and open the auth modal so the
   * user can sign in or create an account first. After successful auth,
   * the product page opens automatically (see the useEffect above).
   */
  const handleViewProduct = (p: Product) => {
    if (!user) {
      PendingAuth.set({ action: 'viewProduct', payload: p });
      // Tell the Header to open its auth modal
      window.dispatchEvent(new CustomEvent('mobile-expert:open-auth'));
      return;
    }
    setSelectedProduct(p);
    setPage('product');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header currentPage={page} onNavigate={handleNavigate} />
      <main className="flex-1">
        {page === 'home' && <HomePage onNavigate={handleNavigate} onView={handleViewProduct} />}
        {page === 'shop' && (
          <ShopPage onView={handleViewProduct} initialCategory={initialCategory} />
        )}
        {page === 'product' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => setPage('shop')}
            onView={handleViewProduct}
          />
        )}
        {page === 'cart' && <CartPage onNavigate={handleNavigate} />}
        {page === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}
        {page === 'wishlist' && (
          <WishlistPage onView={handleViewProduct} onNavigate={handleNavigate} />
        )}
        {page === 'sell' && <SellPage />}
        {page === 'account' && <AccountPage />}
      </main>
      <Footer />
    </div>
  );
}
