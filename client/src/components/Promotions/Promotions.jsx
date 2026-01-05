import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppContext } from "../../App";
import { Tag } from "lucide-react";
import "./Promotions.css";

const DEFAULT_IMG = "/assets/defaultCollection.jpg";

// 1 mobile, 3 tablet, 4 desktop
function useResponsiveCols() {
    const getCols = () => {
        const w = window.innerWidth;
        if (w >= 1024) return 4; // desktop
        if (w >= 640) return 3; // tablet
        return 1; // mobile
    };

    const [cols, setCols] = useState(getCols);

    useEffect(() => {
        const onResize = () => setCols(getCols());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return cols;
}

// ✅ Fixed layouts per screen size (no randomness)
// Each item is { c: colSpan, r: rowSpan }
const FIXED_LAYOUTS = {
    1: {
        1: [{ c: 1, r: 2 }],
    },
    3: {
        1: [{ c: 3, r: 2 }],
        2: [{ c: 2, r: 2 }, { c: 1, r: 2 }],
        3: [{ c: 2, r: 2 }, { c: 1, r: 1 }, { c: 1, r: 1 }],
    },
    4: {
        1: [{ c: 4, r: 2 }],
        2: [{ c: 3, r: 2 }, { c: 1, r: 2 }],
        3: [{ c: 2, r: 2 }, { c: 2, r: 1 }, { c: 2, r: 1 }],
        4: [{ c: 2, r: 2 }, { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 1 }],
    },
};

function getWindow(arr, start, size) {
    if (!arr?.length) return [];
    return Array.from({ length: size }, (_, i) => arr[(start + i) % arr.length]);
}

const Promotions = () => {
    const { API_URL } = useAppContext();

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    // rotates which promos are shown
    const [startIndex, setStartIndex] = useState(0);

    // layout spans (fixed for the current breakpoint)
    const [layout, setLayout] = useState([]);

    const cols = useResponsiveCols();

    // number of visible tiles for this breakpoint (cap at 4)
    const visibleSlots = useMemo(() => {
        const maxByViewport = Math.min(cols, 4);
        return Math.min(maxByViewport, promotions.length || 0);
    }, [cols, promotions.length]);

    // Strip "/api" if present so image paths can be built correctly
    const API_BASE = useMemo(() => API_URL.replace(/\/api\/?$/i, ""), [API_URL]);

    const resolveImage = (path) => {
        if (!path) return DEFAULT_IMG;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (path.startsWith("/")) return `${API_BASE}${path}`;
        return `${API_BASE}/${path.replace(/^\/+/, "")}`;
    };

    const formatDiscount = (promo) => {
        if (promo?.promo_type === "amount") return `${promo.discount_value} OFF`;
        return `${promo.discount_value}% OFF`;
    };

    // Fetch promos
    useEffect(() => {
        const fetchPromos = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/promotions`);
                const data = (res.data || []).filter(
                    (p) => String(p.is_active) === "1" || p.is_active === 1
                );
                setPromotions(data);
            } catch (err) {
                console.error("Error fetching promotions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPromos();
    }, [API_URL]);

    // ✅ Set a FIXED layout whenever screen size (cols) or visible count changes
    useEffect(() => {
        if (!visibleSlots) {
            setLayout([]);
            return;
        }

        const fixed = FIXED_LAYOUTS[cols]?.[visibleSlots];

        // Fallback if something unexpected happens
        setLayout(
            fixed || Array.from({ length: visibleSlots }, () => ({ c: 1, r: 1 }))
        );
    }, [cols, visibleSlots]);

    // ✅ Rotate ONLY the data (not the layout)
    useEffect(() => {
        if (!promotions.length) return;
        if (visibleSlots <= 0) return;
        if (promotions.length <= visibleSlots) return;

        const id = setInterval(() => {
            setStartIndex((prev) => (prev + 1) % promotions.length);
        }, 4000);

        return () => clearInterval(id);
    }, [promotions.length, visibleSlots]);

    const visiblePromos = useMemo(() => {
        if (!promotions.length || visibleSlots <= 0) return [];
        return getWindow(promotions, startIndex, visibleSlots);
    }, [promotions, startIndex, visibleSlots]);

    if (loading || promotions.length === 0 || visibleSlots === 0) return null;

    return (
        <section className="promotions-bento">
            <h2 className="section-title">Promotions</h2>
            <div className="promotions-bento-grid">
                {visiblePromos.map((promo, idx) => {
                    const spans = layout[idx] || { c: 1, r: 1 };

                    return (
                        // ✅ key is slot-based so DOM positions stay stable (bento doesn't "change")
                        <article
                            key={`slot-${idx}`}
                            className={`promo-tile promo-shape-${idx + 1}`}
                            style={{
                                gridColumn: `span ${spans.c}`,
                                gridRow: `span ${spans.r}`,
                                backgroundImage: `url("${resolveImage(promo.image_path)}")`,
                            }}
                        >
                            <div className="promo-tile-overlay" />

                            <div className="promo-tile-top">
                                <span className="promo-pill">
                                    <Tag size={14} />
                                    {formatDiscount(promo)}
                                </span>

                                <span
                                    className={`promo-code ${promo.coupon_code ? "" : "promo-code--muted"
                                        }`}
                                >
                                    {promo.coupon_code
                                        ? `Code: ${promo.coupon_code}`
                                        : "No code needed"}
                                </span>
                            </div>

                            <div className="promo-tile-content">
                                <h3 className="promo-title">{promo.title}</h3>
                                {promo.subtitle ? (
                                    <p className="promo-subtitle">{promo.subtitle}</p>
                                ) : null}
                                {promo.description ? (
                                    <p className="promo-desc">{promo.description}</p>
                                ) : null}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default Promotions;
