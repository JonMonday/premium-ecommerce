// src/components/FilterModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";

function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);

        if (mq.addEventListener) mq.addEventListener("change", onChange);
        else mq.addListener(onChange);

        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", onChange);
            else mq.removeListener(onChange);
        };
    }, [query]);

    return matches;
}

export default function FilterModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 720px)");
    const isTablet = useMediaQuery("(max-width: 960px)");

    const {
        API_URL,
        categories,
        setSelectedCategoryId,
        setSelectedSubcategoryId,
        goToPage,
    } = useAppContext();

    const parentCats = useMemo(() => (categories || []).filter(c => c.id !== 0), [categories]);

    const [subsByCat, setSubsByCat] = useState({});
    const [activeCatId, setActiveCatId] = useState(null);

    // "hovered" drives preview fetching
    const [hovered, setHovered] = useState({ catId: null, subId: null });

    // On mobile, we preview on tap then apply via button
    const [pendingSelection, setPendingSelection] = useState(null);

    const [preview, setPreview] = useState(null);
    const previewCache = useRef(new Map()); // subId -> product

    // Load subcategories when modal opens
    useEffect(() => {
        if (!isOpen) return;
        if (!parentCats.length) return;

        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                parentCats.map((c) =>
                    axios
                        .get(`${API_URL}/categories/${c.id}/subcategories`)
                        .then((r) => [c.id, r.data || []])
                        .catch(() => [c.id, []])
                )
            );

            if (cancelled) return;

            const map = {};
            for (const [catId, subs] of results) map[catId] = subs;
            setSubsByCat(map);

            const firstCat = parentCats[0];
            const firstSub = (map[firstCat.id] || [])[0];

            setActiveCatId(firstCat?.id ?? null);

            if (firstCat && firstSub) {
                setHovered({ catId: firstCat.id, subId: firstSub.id });
                setPendingSelection({ catId: firstCat.id, subId: firstSub.id });
            } else {
                setHovered({ catId: firstCat?.id ?? null, subId: null });
                setPendingSelection(null);
                setPreview(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, API_URL, parentCats]);

    // Fetch preview product when hovered subcategory changes
    useEffect(() => {
        if (!isOpen) return;
        if (!hovered.subId) return;

        let cancelled = false;

        (async () => {
            if (previewCache.current.has(hovered.subId)) {
                setPreview(previewCache.current.get(hovered.subId));
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/products`, {
                    params: { subcategory_id: hovered.subId, page: 1, limit: 1, sort: "popular" },
                });

                const product = res.data?.items?.[0] || null;
                previewCache.current.set(hovered.subId, product);
                if (!cancelled) setPreview(product);
            } catch {
                if (!cancelled) setPreview(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, API_URL, hovered.subId]);

    // Prevent background scroll when modal open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => (document.body.style.overflow = prev);
    }, [isOpen]);

    if (!isOpen) return null;

    const applySelection = (catId, subId) => {
        setSelectedCategoryId(catId);
        setSelectedSubcategoryId(subId);
        goToPage?.(1);
        onClose();
        navigate("/shop");
    };

    const onSubHover = (catId, subId) => {
        setHovered({ catId, subId });
        setPendingSelection({ catId, subId });
    };

    const onSubClick = (catId, subId) => {
        // Desktop: click applies
        if (!isMobile) return applySelection(catId, subId);

        // Mobile: click previews (apply via bottom button)
        onSubHover(catId, subId);
    };

    return (
        <div className="filter-modal-overlay" onMouseDown={onClose}>
            <div className="filter-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="filter-modal-header">
                    <div className="filter-modal-title">Filter</div>
                    <button className="filter-close" onClick={onClose} aria-label="Close filter">
                        <X size={18} />
                    </button>
                </div>

                {/* Mobile category tabs */}
                <div className="filter-cat-tabs">
                    {parentCats.map((cat) => (
                        <button
                            key={cat.id}
                            className={`filter-cat-tab ${activeCatId === cat.id ? "active" : ""}`}
                            onClick={() => {
                                setActiveCatId(cat.id);

                                // Default to first sub of this category
                                const firstSub = (subsByCat[cat.id] || [])[0];
                                if (firstSub) onSubHover(cat.id, firstSub.id);
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className={`filter-grid ${isTablet ? "stack" : ""}`}>
                    {/* LEFT: mega columns */}
                    <div className="filter-groups">
                        {parentCats.map((cat) => {
                            const subs = subsByCat[cat.id] || [];
                            const showOnlyActiveOnMobile = isMobile && activeCatId !== cat.id;

                            return (
                                <div
                                    key={cat.id}
                                    className={`filter-group ${activeCatId === cat.id ? "is-active" : ""} ${showOnlyActiveOnMobile ? "hide-mobile" : ""
                                        }`}
                                >
                                    <div className="filter-title">{cat.name}</div>

                                    <div className="filter-sub-list">
                                        {subs.length === 0 && (
                                            <div className="filter-sub-empty">No subcategories</div>
                                        )}

                                        {subs.map((sub) => {
                                            const active = hovered.subId === sub.id;

                                            return (
                                                <button
                                                    key={sub.id}
                                                    className={`filter-sub-item ${active ? "active" : ""}`}
                                                    onMouseEnter={() => !isMobile && onSubHover(cat.id, sub.id)}
                                                    onFocus={() => onSubHover(cat.id, sub.id)}
                                                    onClick={() => onSubClick(cat.id, sub.id)}
                                                >
                                                    {sub.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT: preview card */}
                    <div className="filter-preview">
                        <div className="filter-preview-card">
                            {preview ? (
                                <>
                                    <div className="filter-preview-img">
                                        <img
                                            src={preview.images?.[0] || ""}
                                            alt={preview.name || "Preview"}
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="filter-preview-body">
                                        <div className="filter-preview-name">{preview.name}</div>
                                        <div className="filter-preview-desc">{preview.description}</div>

                                        {!isMobile && (
                                            <div className="filter-preview-note">
                                                Hover to preview • Click a subcategory to apply
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="filter-preview-empty">
                                    <div className="filter-preview-name">No featured item</div>
                                    <div className="filter-preview-desc">
                                        Hover/tap a subcategory that has products and I’ll show the top item here 👀
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile sticky action */}
                {isMobile && (
                    <div className="filter-mobile-actions">
                        <button className="filter-apply-btn" disabled={!pendingSelection?.subId}
                            onClick={() => pendingSelection && applySelection(pendingSelection.catId, pendingSelection.subId)}
                        >
                            View products →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
