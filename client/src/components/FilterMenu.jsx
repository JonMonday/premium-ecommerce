import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../App';

const FilterMenu = ({
    open,
    topOffset = 0,
    categories,
    onMouseEnter,
    onMouseLeave,
    onClose,
    onPickCategory,
    onPickSubcategory,
}) => {
    const { API_URL } = useAppContext();

    const cats = useMemo(
        () => (categories || []).filter((c) => (c.subcategories || []).length > 0),
        [categories]
    );

    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Default selection when menu opens
    useEffect(() => {
        if (!open) return;

        const firstCat = cats[0];
        const firstSub = firstCat?.subcategories?.[0];

        setActiveCategoryId(firstCat?.id ?? null);
        setActiveSubcategoryId(firstSub?.id ?? null);
    }, [open, cats]);

    // Fetch preview product for active hover
    useEffect(() => {
        if (!open) return;

        const idToPreview = activeSubcategoryId || activeCategoryId;
        if (!idToPreview) return;

        let cancelled = false;

        const load = async () => {
            setPreviewLoading(true);
            try {
                const params = {
                    page: 1,
                    limit: 1,
                    sort: 'popular',
                    category_id: activeSubcategoryId ? undefined : activeCategoryId || undefined,
                    subcategory_id: activeSubcategoryId || undefined,
                };

                const res = await axios.get(`${API_URL}/products`, { params });
                const item = res?.data?.items?.[0] || null;
                if (!cancelled) setPreview(item);
            } catch (e) {
                if (!cancelled) setPreview(null);
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [open, API_URL, activeCategoryId, activeSubcategoryId]);

    if (!open) return null;

    const activeCategory = cats.find((c) => c.id === activeCategoryId) || cats[0];
    const subs = activeCategory?.subcategories || [];

    const handleCategoryHover = (cat) => {
        setActiveCategoryId(cat.id);
        setActiveSubcategoryId(cat.subcategories?.[0]?.id ?? null); // default to first subcategory
    };

    const previewImage =
        preview?.image ||
        (Array.isArray(preview?.images) ? preview.images[0] : null) ||
        null;

    return (
        <div
            className="filter-menu"
            style={{ top: topOffset }}
            role="dialog"
            aria-label="Filter products"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="filter-menu-inner">
                <button className="filter-menu-close" type="button" onClick={onClose} aria-label="Close filter">
                    ✕
                </button>

                <div className="filter-menu-cols">
                    {/* LEFT: Categories + Subcategories */}
                    <div className="filter-menu-left">
                        <div className="filter-col">
                            <div className="filter-col-title">Categories</div>

                            <div className="filter-list">
                                {cats.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`filter-item`}
                                        onMouseEnter={() => handleCategoryHover(cat)}
                                        onFocus={() => handleCategoryHover(cat)}
                                        onClick={() => onPickCategory(cat.id)}
                                    >
                                        <span className="filter-item-text">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-col">
                            <div className="filter-col-title">Subcategories</div>

                            <div className="filter-list">
                                {subs.map((sub) => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        className={`filter-item`}
                                        onMouseEnter={() => setActiveSubcategoryId(sub.id)}
                                        onFocus={() => setActiveSubcategoryId(sub.id)}
                                        onClick={() => onPickSubcategory(activeCategory.id, sub.id)}
                                    >
                                        <span className="filter-item-text">{sub.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="filter-menu-right">
                        <div className="filter-preview-card">
                            <div className="filter-preview-media">
                                {previewImage ? (
                                    <img src={previewImage} alt={preview?.name || 'Preview product'} loading="lazy" decoding="async" />
                                ) : (
                                    <div className="filter-preview-skeleton" />
                                )}
                            </div>

                            <div className="filter-preview-body">
                                <div className="filter-preview-title">
                                    {previewLoading ? 'Loading…' : preview?.name || 'No products found'}
                                </div>
                                <div className="filter-preview-text">
                                    {previewLoading
                                        ? 'Finding the best match…'
                                        : preview?.description || 'Try another category.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterMenu;
