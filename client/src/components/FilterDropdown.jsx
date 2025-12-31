import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";

export default function FilterDropdown({ isOpen, anchorRef, onClose, onMouseEnter, onMouseLeave }) {
    const navigate = useNavigate();
    const {
        API_URL,
        categories,
        setSelectedCategoryId,
        setSelectedSubcategoryId,
        goToPage,
    } = useAppContext();

    const parents = useMemo(
        () => (categories || []).filter(c => c.id !== 0),
        [categories]
    );

    const [subsByCat, setSubsByCat] = useState({});
    const [visibleCats, setVisibleCats] = useState([]);
    const [activeCatId, setActiveCatId] = useState(null);
    const [activeSubId, setActiveSubId] = useState(null);

    const [preview, setPreview] = useState(null);
    const cache = useRef(new Map()); // key: `cat:ID` or `sub:ID`

    const [top, setTop] = useState(0);

    // position dropdown under the Filter button
    useLayoutEffect(() => {
        if (!isOpen) return;

        const updateTop = () => {
            const rect = anchorRef?.current?.getBoundingClientRect();
            setTop(rect ? rect.bottom : 0);
        };

        updateTop();
        window.addEventListener("resize", updateTop);
        window.addEventListener("scroll", updateTop, true);
        return () => {
            window.removeEventListener("resize", updateTop);
            window.removeEventListener("scroll", updateTop, true);
        };
    }, [isOpen, anchorRef]);

    // close on outside click (works for mobile too)
    useEffect(() => {
        if (!isOpen) return;
        const onDocDown = (e) => {
            // if click is not inside dropdown AND not on anchor, close
            const dropdown = document.querySelector(".filter-dd");
            const anchor = anchorRef?.current;
            if (dropdown && dropdown.contains(e.target)) return;
            if (anchor && anchor.contains(e.target)) return;
            onClose?.();
        };
        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, [isOpen, onClose, anchorRef]);

    // load subcategories for each category, hide categories with no subcategories
    useEffect(() => {
        if (!isOpen) return;
        if (!parents.length) return;

        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                parents.map(c =>
                    axios
                        .get(`${API_URL}/categories/${c.id}/subcategories`)
                        .then(r => [c.id, r.data || []])
                        .catch(() => [c.id, []])
                )
            );

            if (cancelled) return;

            const map = {};
            for (const [catId, subs] of results) map[catId] = subs;

            setSubsByCat(map);

            const filtered = parents.filter(c => (map[c.id] || []).length > 0);
            setVisibleCats(filtered);

            // default: first visible category -> show its top product
            const firstCat = filtered[0];
            const firstSub = firstCat ? (map[firstCat.id] || [])[0] : null;

            setActiveCatId(firstCat?.id ?? null);
            setActiveSubId(firstSub?.id ?? null);

            if (firstCat?.id) {
                await fetchPreviewForCategory(firstCat.id);
            } else {
                setPreview(null);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, API_URL, parents.length]);

    const fetchPreviewForCategory = async (catId) => {
        const key = `cat:${catId}`;
        if (cache.current.has(key)) {
            setPreview(cache.current.get(key));
            return;
        }
        const res = await axios.get(`${API_URL}/products`, {
            params: { category_id: catId, page: 1, limit: 1, sort: "popular" },
        });
        const product = res.data?.items?.[0] || null;
        cache.current.set(key, product);
        setPreview(product);
    };

    const fetchPreviewForSubcategory = async (subId) => {
        const key = `sub:${subId}`;
        if (cache.current.has(key)) {
            setPreview(cache.current.get(key));
            return;
        }
        const res = await axios.get(`${API_URL}/products`, {
            params: { subcategory_id: subId, page: 1, limit: 1, sort: "popular" },
        });
        const product = res.data?.items?.[0] || null;
        cache.current.set(key, product);
        setPreview(product);
    };

    const applyCategory = (catId) => {
        setSelectedCategoryId(catId);
        setSelectedSubcategoryId(null);
        goToPage?.(1);
        onClose?.();
        navigate("/shop");
    };

    const applySubcategory = (catId, subId) => {
        setSelectedCategoryId(catId);
        setSelectedSubcategoryId(subId);
        goToPage?.(1);
        onClose?.();
        navigate("/shop");
    };

    if (!isOpen) return null;

    return (
        <div
            className="filter-dd"
            style={{ top }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="dialog"
            aria-label="Filter"
        >
            <div className="filter-dd-inner">
                {/* LEFT: categories + subcategories */}
                <div className="filter-dd-left">
                    <div className="filter-dd-cols">
                        {visibleCats.map((cat) => {
                            const subs = subsByCat[cat.id] || [];
                            return (
                                <div key={cat.id} className="filter-dd-group">
                                    {/* category header is clickable + hover preview */}
                                    <button
                                        className={`filter-dd-title `}
                                        onMouseEnter={() => {
                                            setActiveCatId(cat.id);
                                            setActiveSubId(null);
                                            fetchPreviewForCategory(cat.id);
                                        }}
                                        onFocus={() => {
                                            setActiveCatId(cat.id);
                                            setActiveSubId(null);
                                            fetchPreviewForCategory(cat.id);
                                        }}
                                        onClick={() => applyCategory(cat.id)}
                                        type="button"
                                    >
                                        {cat.name}
                                    </button>

                                    <div className="filter-dd-sublist">
                                        {subs.map((sub) => (
                                            <button
                                                key={sub.id}
                                                className={`filter-dd-sub `}
                                                onMouseEnter={() => {
                                                    setActiveCatId(cat.id);
                                                    setActiveSubId(sub.id);
                                                    fetchPreviewForSubcategory(sub.id);
                                                }}
                                                onFocus={() => {
                                                    setActiveCatId(cat.id);
                                                    setActiveSubId(sub.id);
                                                    fetchPreviewForSubcategory(sub.id);
                                                }}
                                                onClick={() => applySubcategory(cat.id, sub.id)}
                                                type="button"
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: preview */}
                <div className="filter-dd-right">
                    {preview ? (
                        <div className="filter-dd-preview">
                            <div className="filter-dd-media">
                                <img src={preview.images?.[0] || ""} alt={preview.name} />
                            </div>
                            <div className="filter-dd-info">
                                <div className="filter-dd-name">{preview.name}</div>
                                <div className="filter-dd-desc">{preview.description}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="filter-dd-preview empty">
                            <div className="filter-dd-name">No preview</div>
                            <div className="filter-dd-desc">This category/subcategory has no products.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
