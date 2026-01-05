import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { useAppContext } from '../../App';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import FilterMenu from '../../components/FilterMenu/FilterMenu';
import FilterModal from '../../components/FilterModal/FilterModal';
import './ShopPage.css';

const buildPageRange = (page, totalPages, maxButtons) => {
    if (totalPages <= maxButtons) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, totalPages, page]);

    const neighbors = Math.floor((maxButtons - 3) / 2);
    for (let i = 1; i <= neighbors; i++) {
        pages.add(page - i);
        pages.add(page + i);
    }

    const cleaned = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    // Add ellipses marker (as null) where gaps exist
    const out = [];
    for (let i = 0; i < cleaned.length; i++) {
        out.push(cleaned[i]);
        if (i < cleaned.length - 1 && cleaned[i + 1] - cleaned[i] > 1) out.push(null);
    }
    return out;
};

const ShopPage = () => {
    const navigate = useNavigate();
    const {
        products,
        loading,
        page,
        totalPages,
        goToPage,
        totalItems,
        categoriesWithChildren,
        selectedCategoryName,
        selectedSubcategoryName,
        applyCategoryFilter,
        applySubcategoryFilter,
        selectedCategoryId,
        selectedSubcategoryId,
    } = useAppContext();

    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
    const range = useMemo(() => buildPageRange(page, totalPages, isMobile ? 5 : 7), [page, totalPages, isMobile]);

    // Filter UI State
    const [filterOpen, setFilterOpen] = useState(false);
    const filterBtnRef = useRef(null);

    const openFilter = () => setFilterOpen(true);
    const closeFilter = () => setFilterOpen(false);

    const onPickCategory = (categoryId) => {
        applyCategoryFilter(categoryId);
        closeFilter();
    };

    const onPickSubcategory = (parentId, subId) => {
        applySubcategoryFilter(parentId, subId);
        closeFilter();
    };

    const clearFilters = () => {
        applyCategoryFilter(0);
    };

    const hasActiveFilters = (selectedCategoryId && selectedCategoryId !== 0) || !!selectedSubcategoryId;

    return (
        <div className="shop-page">
            <div className="container shop-header">
                <div>
                    <h1 className="shop-title">Shop</h1>
                    <div className="shop-subtitle">
                        {selectedCategoryName || 'All Products'}
                        {selectedSubcategoryName && <span className="shop-subtitle-sub">/ {selectedSubcategoryName}</span>}
                        <span className="shop-count">({totalItems} items)</span>
                    </div>
                </div>

                <div className="shop-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {hasActiveFilters && (
                        <button className="shop-clear-filter" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                    <button
                        ref={filterBtnRef}
                        className="btn btn-secondary"
                        onClick={openFilter}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Render appropriate filter component based on device or preference */}
            {isMobile ? (
                <FilterModal
                    isOpen={filterOpen}
                    onClose={closeFilter}
                />
            ) : (
                <FilterMenu
                    open={filterOpen}
                    onClose={closeFilter}
                    topOffset={filterBtnRef.current?.getBoundingClientRect().bottom + window.scrollY + 10}
                    categories={categoriesWithChildren}
                    onPickCategory={onPickCategory}
                    onPickSubcategory={onPickSubcategory}
                />
            )}

            <ProductGrid products={products} loading={loading} />

            {/* Pagination */}
            <div className="pagination">
                <button
                    className="page-btn"
                    onClick={() => goToPage(1)}
                    disabled={page <= 1 || loading}
                    aria-label="First page"
                >
                    First
                </button>
                <button
                    className="page-btn"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                >
                    Prev
                </button>

                <div className="page-numbers" role="navigation" aria-label="Pagination">
                    {range.map((p, idx) =>
                        p === null ? (
                            <span key={`gap-${idx}`} className="page-ellipsis">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                className={`page-number ${p === page ? 'active' : ''}`}
                                onClick={() => goToPage(p)}
                                disabled={loading}
                                aria-current={p === page ? 'page' : undefined}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <button
                    className="page-btn"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    aria-label="Next page"
                >
                    Next
                </button>
                <button
                    className="page-btn"
                    onClick={() => goToPage(totalPages)}
                    disabled={page >= totalPages || loading}
                    aria-label="Last page"
                >
                    Last
                </button>
            </div>
        </div>
    );
};

export default ShopPage;
