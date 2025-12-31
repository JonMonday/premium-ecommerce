import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../App';
import FilterMenu from './FilterMenu';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProductPage = location.pathname.startsWith('/product/');

    const {
        searchQuery,
        setSearchQuery,
        cart,
        user,
        setIsCartOpen,
        loading,
        totalItems,
        selectedCategoryName,
        selectedSubcategoryName,
        activeProductTitle,
        categoriesWithChildren,
        selectedCategoryId,
        selectedSubcategoryId,
        applyCategoryFilter,
        applySubcategoryFilter,
    } = useAppContext();

    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const measure = () => {
            const h = headerRef.current?.getBoundingClientRect?.().height || 0;
            setHeaderHeight(Math.ceil(h));
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const [filterOpen, setFilterOpen] = useState(false);
    const closeTimer = useRef(null);

    useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    const openFilter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setFilterOpen(true);
    };

    const scheduleCloseFilter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setFilterOpen(false), 160);
    };

    const closeFilter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setFilterOpen(false);
    };

    const isFilterActive =
        (selectedCategoryId && selectedCategoryId !== 0) || !!selectedSubcategoryId;

    const onPickCategory = (categoryId) => {
        applyCategoryFilter(categoryId);
        navigate('/shop');
        closeFilter();
    };

    const onPickSubcategory = (parentId, subId) => {
        applySubcategoryFilter(parentId, subId);
        navigate('/shop');
        closeFilter();
    };

    return (
        <header ref={headerRef} className="header glass">
            <div className="container header-container-inner">
                {/* Row 1: Logo and Profile */}
                <div className="header-top-row">
                    <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span className="logo">BOUTIQUE</span>
                    </div>
                    <div className="user-info" onClick={() => navigate('/')}>
                        <User size={20} />
                        <span>{user ? user.username.split(' ')[0] : 'Guest'}</span>
                    </div>
                </div>

                {/* Row 2: Home, Shop, and Cart */}
                <div className="header-bottom-row">
                    <nav className="main-nav">
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            Home
                        </NavLink>
                        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            Shop
                        </NavLink>
                    </nav>
                    <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
                        <ShoppingCart size={20} />
                        <span className="header-cart-label">Cart</span>
                        <span className="cart-count">{cart?.length || 0}</span>
                    </div>
                </div>

                {/* {!isHomePage && (
                    <div className="search-section">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (location.pathname !== '/shop') navigate('/shop');
                                }}
                            />
                            <button className="search-btn" onClick={() => navigate('/shop')} type="button">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                )} */}
            </div>

            {/* Filter button row */}
            {!isHomePage && (
                <nav className="category-nav container">
                    <div className="filter-wrapper">
                        {/* Subtitle Row */}
                        <div className="shop-subtitle-row">
                            {isProductPage && (
                                <button
                                    type="button"
                                    className="shop-back-btn"
                                    onClick={() => navigate(-1)}
                                    aria-label="Go back"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            )}

                            <p className="shop-subtitle">
                                {isProductPage ? (
                                    <>
                                        {activeProductTitle || 'Product'}
                                    </>
                                ) : (
                                    <>
                                        {selectedSubcategoryName
                                            ? `${selectedCategoryName} / ${selectedSubcategoryName}`
                                            : `${selectedCategoryName}`}
                                        <span className="shop-count">({totalItems} items)</span>
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Hide search/filter/clear on product page */}
                        {!isProductPage && (
                            <>
                                <div className="search-section">
                                    <div className="search-bar">
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                if (location.pathname !== '/shop') navigate('/shop');
                                            }}
                                        />
                                        <button className="search-btn" onClick={() => navigate('/shop')} type="button">
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="filter-wrapper2">
                                    <div
                                        className="nav-item-wrapper"
                                        onMouseEnter={openFilter}
                                        onMouseLeave={scheduleCloseFilter}
                                    >
                                        <button
                                            type="button"
                                            className={`shop-clear-filter  ${isFilterActive ? 'active' : ''}`}
                                            onClick={() => setFilterOpen((v) => !v)}
                                            aria-haspopup="dialog"
                                            aria-expanded={filterOpen}
                                        >
                                            Filter
                                        </button>

                                        <FilterMenu
                                            open={filterOpen}
                                            topOffset={headerHeight}
                                            categories={categoriesWithChildren}
                                            onMouseEnter={openFilter}
                                            onMouseLeave={scheduleCloseFilter}
                                            onClose={closeFilter}
                                            onPickCategory={onPickCategory}
                                            onPickSubcategory={onPickSubcategory}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="shop-clear-filter"
                                        onClick={() => {
                                            setSearchQuery('');
                                            applyCategoryFilter(0);
                                        }}
                                        disabled={loading}
                                    >
                                        Clear filter
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            )}

        </header>
    );
};

export default Header;
