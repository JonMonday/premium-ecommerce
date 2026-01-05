import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, ArrowLeft, Heart } from 'lucide-react';
import { useAppContext } from '../../App';
import NavLinkModal from '../NavLinkModal/NavLinkModal';
import './Header.css';

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
        setUser,
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
        wishlist,
        setIsAuthOpen
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

    const [collectionModalOpen, setCollectionModalOpen] = useState(false);
    const [promotionModalOpen, setPromotionModalOpen] = useState(false);
    const closeTimer = useRef(null);

    useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    const openCollectionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setCollectionModalOpen(true);
    };

    const openPromotionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setPromotionModalOpen(true);
    };

    const scheduleCloseCollectionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setCollectionModalOpen(false), 160);
    };
    const scheduleClosePromotionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setPromotionModalOpen(false), 160);
    };

    const closeCollectionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setCollectionModalOpen(false);
    };
    const closePromotionModal = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setPromotionModalOpen(false);
    };

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

    const handleUserClick = () => {
        if (user?.username) {
            if (window.confirm("Do you want to sign out?")) {
                localStorage.removeItem('boutique_device_id');
                window.location.reload();
            }
        } else {
            setIsAuthOpen(true);
        }
    };

    return (
        <header ref={headerRef} className="header glass">
            <div className="container header-container-inner">
                <div className="header-top-row">
                    <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span className="logo">BOUTIQUE</span>
                    </div>
                    <div className="header-actions">
                        <div className="wishlist-icon" onClick={() => navigate('/shop')} title="View Wishlist">
                            <Heart size={20} />
                            <span className="cart-count">{wishlist?.length || 0}</span>
                        </div>
                        <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
                            <ShoppingCart size={20} />
                            <span className="cart-count">{cart?.length || 0}</span>
                        </div>
                        <div className="user-info" onClick={handleUserClick} style={{ cursor: 'pointer' }}>
                            <User size={20} />
                            <span>{user?.username ? user.username.split(' ')[0] : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="header-bottom-row">
                    <nav className="main-nav">
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            Home
                        </NavLink>
                        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            Shop
                        </NavLink>
                        <div
                            onMouseEnter={openCollectionModal}
                            onMouseLeave={scheduleCloseCollectionModal}
                        >
                            <a
                                type="button"
                                className='nav-modal'
                                onClick={() => setCollectionModalOpen((v) => !v)}
                                aria-haspopup="dialog"
                                aria-expanded={collectionModalOpen}
                            >
                                Collections
                            </a>
                            <NavLinkModal
                                open={collectionModalOpen}
                                topOffset={headerHeight}
                                optionName="collections"
                                onMouseEnter={openCollectionModal}
                                onMouseLeave={scheduleCloseCollectionModal}
                                onClose={closeCollectionModal}
                                onPickCategory={onPickCategory}
                                onPickSubcategory={onPickSubcategory}
                            />

                        </div>

                        <div
                            onMouseEnter={openPromotionModal}
                            onMouseLeave={scheduleClosePromotionModal}
                        >
                            <a
                                type="button"
                                className='nav-modal'
                                onClick={() => setPromotionModalOpen((v) => !v)}
                                aria-haspopup="dialog"
                                aria-expanded={promotionModalOpen}
                            >
                                Promotions
                            </a>
                            <NavLinkModal
                                open={promotionModalOpen}
                                topOffset={headerHeight}
                                optionName="promotions"
                                onMouseEnter={openPromotionModal}
                                onMouseLeave={scheduleClosePromotionModal}
                                onClose={closePromotionModal}
                                onPickCategory={onPickCategory}
                                onPickSubcategory={onPickSubcategory}
                            />

                        </div>

                        {/* <div
                            onMouseEnter={openCollectionModal}
                            onMouseLeave={scheduleCloseCollectionModal}
                        >
                            <a
                                type="button"
                                className='nav-modal'
                                onClick={() => setCollectionModalOpen((v) => !v)}
                                aria-haspopup="dialog"
                                aria-expanded={collectionModalOpen}
                            >
                                Promotions
                            </a>
                            <CollectionModal
                                open={collectionModalOpen}
                                topOffset={headerHeight}
                                categories={categoriesWithChildren}
                                onMouseEnter={openCollectionModal}
                                onMouseLeave={scheduleCloseCollectionModal}
                                onClose={closeCollectionModal}
                                onPickCategory={onPickCategory}
                                onPickSubcategory={onPickSubcategory}
                            />

                        </div> */}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
