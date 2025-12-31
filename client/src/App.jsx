import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import axios from 'axios';
import './App.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import RegistrationModal from './components/RegistrationModal';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import HomePage from './components/HomePage';
import ShopPage from './components/ShopPage';
import Footer from './components/Footer';
import ProductPage from './components/ProductPage';

// Context for User and Cart
const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const App = () => {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeProductTitle, setActiveProductTitle] = useState('');


  // categories tree: [{id,name,icon,subcategories:[...]}]
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [products, setProducts] = useState([]);

  // filters
  const [selectedCategoryId, setSelectedCategoryId] = useState(0); // 0 = All
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const limit = 30;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const categoriesWithChildren = useMemo(
    () => (categoriesTree || []).filter((c) => (c.subcategories || []).length > 0),
    [categoriesTree]
  );

  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === 0) return 'All';
    const parent = categoriesTree.find((c) => c.id === selectedCategoryId);
    if (parent) return parent.name;
    const child = categoriesTree.flatMap((c) => c.subcategories || []).find((s) => s.id === selectedCategoryId);
    return child?.name || 'All';
  }, [selectedCategoryId, categoriesTree]);

  const selectedSubcategoryName = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    const child = categoriesTree.flatMap((c) => c.subcategories || []).find((s) => s.id === selectedSubcategoryId);
    return child?.name || null;
  }, [selectedSubcategoryId, categoriesTree]);

  useEffect(() => {
    identifyUser();
    fetchCategoriesTree();
    // initial products
    fetchProducts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch products when filters/page/search change
  useEffect(() => {
    fetchProducts({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedSubcategoryId, searchQuery, page]);

  const identifyUser = async () => {
    let deviceId = localStorage.getItem('boutique_device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('boutique_device_id', deviceId);
    }

    try {
      const res = await axios.post(`${API_URL}/users/identify`, { device_id: deviceId });
      if (res.data && res.data.username) {
        setUser(res.data);
      } else {
        setIsRegistering(true);
      }
    } catch (err) {
      console.error('Identification error:', err);
      // Fallback to registration for any error (e.g. 404)
      setIsRegistering(true);
    }
  };

  const fetchCategoriesTree = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories/tree`);
      setCategoriesTree(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoriesTree([]);
    }
  };

  const fetchProducts = async ({ page: pageToLoad = 1 } = {}) => {
    setLoading(true);
    try {
      const params = {
        page: pageToLoad,
        limit,
        sort: 'popular',
        search: searchQuery || undefined,
        category_id: selectedCategoryId && selectedCategoryId !== 0 ? selectedCategoryId : undefined,
        subcategory_id: selectedSubcategoryId || undefined,
      };

      const res = await axios.get(`${API_URL}/products`, { params });

      const data = res.data || {};
      const items = Array.isArray(data) ? data : data.items || [];

      setProducts(items);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || items.length);
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    const next = Math.min(Math.max(p, 1), totalPages || 1);
    setPage(next);
  };

  const applyCategoryFilter = (categoryId) => {
    setSelectedCategoryId(categoryId || 0);
    setSelectedSubcategoryId(null);
    setPage(1);
  };

  const applySubcategoryFilter = (parentCategoryId, subcategoryId) => {
    setSelectedCategoryId(parentCategoryId || 0);
    setSelectedSubcategoryId(subcategoryId);
    setPage(1);
  };

  const registerUser = async (formData) => {
    const deviceId = localStorage.getItem('boutique_device_id');
    try {
      const res = await axios.post(`${API_URL}/users/identify`, {
        device_id: deviceId,
        ...formData,
      });
      setUser(res.data);
      setIsRegistering(false);
      alert(
        'Registration successful! Please check your email for confirmation link (see server console).'
      );
    } catch (err) {
      alert('Registration failed. Please try again.');
    }
  };

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckoutComplete = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cart,
        setCart,
        isCartOpen,
        setIsCartOpen,
        products,
        setProducts,
        loading,
        API_URL,
        activeProductTitle,
        setActiveProductTitle,

        // filters
        categoriesTree,
        categoriesWithChildren,
        selectedCategoryId,
        selectedSubcategoryId,
        selectedCategoryName,
        selectedSubcategoryName,
        setSelectedCategoryId,
        setSelectedSubcategoryId,
        applyCategoryFilter,
        applySubcategoryFilter,
        searchQuery,
        setSearchQuery,

        // pagination
        page,
        totalPages,
        totalItems,
        goToPage,

        // product modal
        selectedProduct,
        setSelectedProduct,
      }}
    >
      <Router>
        <div className="app">
          <Header />

          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </main>

          <Footer />

          {isRegistering && (
            <RegistrationModal
              onRegister={registerUser}
              onSkip={() => setIsRegistering(false)}
            />
          )}



          <Cart
            cart={cart}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onRemove={removeFromCart}
            onCheckout={() => setIsCheckoutOpen(true)}
          />

          {isCheckoutOpen && (
            <Checkout
              cart={cart}
              user={user}
              onClose={() => setIsCheckoutOpen(false)}
              onComplete={handleCheckoutComplete}
              API_URL={API_URL}
            />
          )}
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
