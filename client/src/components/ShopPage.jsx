import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import ProductGrid from './ProductGrid';

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
    const {
        products,
        loading,
        selectedCategoryName,
        selectedSubcategoryName,

        page,
        totalPages,
        totalItems,
        goToPage,
        applyCategoryFilter,
        setSearchQuery,
    } = useAppContext();

    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;

    const range = useMemo(() => buildPageRange(page, totalPages, isMobile ? 5 : 7), [page, totalPages, isMobile]);

    return (
        <div className="shop-page">

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
