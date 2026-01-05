import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Star, ThumbsUp, ShoppingCart, Heart } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { useAppContext } from "../../App";
import './ProductPage.css';

const normalizeProduct = (p) => {
    if (!p) return null;
    const imgs = Array.isArray(p.images)
        ? p.images
        : (p.images ? String(p.images).split(",") : []);
    return { ...p, images: imgs.filter(Boolean) };
};

const Stars = ({ value = 0 }) => {
    const v = Math.round(Number(value || 0));
    return (
        <span className="pp-stars" aria-label={`${v} stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < v ? "pp-star on" : "pp-star"} fill={i < v ? "currentColor" : "none"} />
            ))}
        </span>
    );
};

export default function ProductPage() {
    const { id } = useParams();
    const {
        API_URL,
        user,
        cart,
        setCart,
        setIsCartOpen,
        setActiveProductTitle,
        wishlist,
        likes,
        toggleWishlist,
        toggleLike
    } = useAppContext();

    const [product, setProduct] = useState(null);
    const [activeImage, setActiveImage] = useState("");
    const [related, setRelated] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [tab, setTab] = useState("details");

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);

    const productId = useMemo(() => Number(id), [id]);

    useEffect(() => {
        return () => setActiveProductTitle("");
    }, [setActiveProductTitle]);

    const isWishlisted = wishlist.some(p => p.id === productId);
    const isLiked = likes.products.includes(productId);

    const availableVariants = product?.variants || [];

    // Filterable options
    const uniqueSizes = [...new Set(availableVariants.map(v => v.size))];
    const uniqueColors = Array.from(new Map(availableVariants.map(v => [v.color, { name: v.color, hex: v.hex_code }])).values());

    const activeVariant = useMemo(() => {
        if (!selectedSize || !selectedColor) return null;
        return availableVariants.find(v => v.size === selectedSize && v.color === selectedColor.name);
    }, [selectedSize, selectedColor, availableVariants]);

    const addToCart = () => {
        if (!product) return;
        if (uniqueSizes.length > 0 && !selectedSize) return alert("Please select a size");
        if (uniqueColors.length > 0 && !selectedColor) return alert("Please select a color");

        const item = {
            ...product,
            selectedSize,
            selectedColor: selectedColor?.name,
            variantId: activeVariant?.id
        };
        setCart([...(cart || []), item]);
        setIsCartOpen(true);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pRes, rRes, relRes] = await Promise.all([
                axios.get(`${API_URL}/products/${productId}`),
                axios.get(`${API_URL}/reviews`, { params: { product_id: productId } }),
                axios.get(`${API_URL}/products/${productId}/related`, { params: { limit: 8 } }),
            ]);

            const p = normalizeProduct(pRes.data);
            setActiveProductTitle(p?.name || "Product");
            setProduct(p);
            setActiveImage(p?.images?.[0] || "");
            setReviews(Array.isArray(rRes.data) ? rRes.data : []);
            setRelated((Array.isArray(relRes.data) ? relRes.data : []).map(normalizeProduct));
        } catch (e) {
            console.error("Failed to load product page:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!productId) return;
        fetchAll();
    }, [productId]);

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user || !user.username) return alert("Please sign in to write a review.");
        if (!comment.trim()) return alert("Please type a review.");

        setPosting(true);
        try {
            await axios.post(`${API_URL}/reviews`, {
                device_id: user.device_id,
                rating,
                comment,
                product_id: productId
            });
            setComment("");
            setRating(5);
            await fetchAll();
        } catch (e) {
            console.error("Review failed:", e);
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="loading container">Loading product…</div>;
    if (!product) return <div className="container">Product not found.</div>;

    const hasDiscount = product.discounted_price && product.discounted_price < product.price;

    return (
        <div className="pp-page">
            <div className="container pp-grid pp-grid--v2">
                <section className="pp-gallery">
                    <div className="pp-gallery-main">
                        {activeImage ? <img src={activeImage} alt={product.name} /> : <div className="pp-noimg">No image</div>}
                    </div>
                    <div className="pp-gallery-strip">
                        {(product.images || []).map((img, i) => (
                            <button
                                key={i}
                                className={`pp-strip-item ${activeImage === img ? "active" : ""}`}
                                onClick={() => setActiveImage(img)}
                                type="button"
                            >
                                <img src={img} alt={`${product.name} ${i + 1}`} />
                            </button>
                        ))}
                    </div>

                    <div className="pp-info-card">
                        <div className="pp-header-row">
                            <h1 className="pp-title">{product.name}</h1>
                            <div className="pp-actions">
                                <button className={`pp-action ${isWishlisted ? 'active' : ''}`} onClick={() => toggleWishlist(productId)}>
                                    <Heart fill={isWishlisted ? "currentColor" : "none"} />
                                </button>
                                <button className={`pp-action ${isLiked ? 'active' : ''}`} onClick={() => toggleLike('product', productId)}>
                                    <ThumbsUp fill={isLiked ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>

                        <div className="pp-info-meta">
                            <Stars value={product.average_rating} />
                            <span className="pp-meta-text">
                                {Number(product.average_rating || 0).toFixed(1)} • {product.review_count} reviews
                            </span>
                        </div>

                        <p className="pp-desc">{product.description}</p>

                        {/* Variants Selection */}
                        <div className="pp-variants">
                            {uniqueSizes.length > 0 && (
                                <div className="pp-variant-group">
                                    <label>Size: <strong>{selectedSize || 'Select'}</strong></label>
                                    <div className="pp-variant-options">
                                        {uniqueSizes.map(s => (
                                            <button
                                                key={s}
                                                className={`variant-btn ${selectedSize === s ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uniqueColors.length > 0 && (
                                <div className="pp-variant-group">
                                    <label>Color: <strong>{selectedColor?.name || 'Select'}</strong></label>
                                    <div className="pp-variant-options">
                                        {uniqueColors.map(c => (
                                            <button
                                                key={c.name}
                                                className={`color-btn ${selectedColor?.name === c.name ? 'active' : ''}`}
                                                onClick={() => setSelectedColor(c)}
                                                style={{ '--color': c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pp-price-row">
                            {hasDiscount ? (
                                <div className="price-stack">
                                    <span className="original-price">${product.price.toFixed(2)}</span>
                                    <div className="pp-price">${product.discounted_price.toFixed(2)}</div>
                                </div>
                            ) : (
                                <div className="pp-price">${product.price.toFixed(2)}</div>
                            )}
                            {product.promotion && <span className="promo-tag">{product.promotion.title}</span>}
                            {product.badge && <span className="pp-badge">{product.badge}</span>}
                        </div>

                        <div className="pp-stock-info">
                            {activeVariant ? (
                                <span className={activeVariant.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}>
                                    {activeVariant.stock_quantity > 0 ? `In Stock (${activeVariant.stock_quantity} available)` : 'Out of Stock'}
                                </span>
                            ) : (
                                <span className="hint">Select variant to check availability</span>
                            )}
                        </div>

                        <button
                            className="btn btn-primary pp-add"
                            onClick={addToCart}
                            disabled={activeVariant && activeVariant.stock_quantity === 0}
                            type="button"
                        >
                            <ShoppingCart size={18} />
                            Add to Cart
                        </button>
                    </div>
                </section>

                <aside className="pp-reviews-side">
                    <div className="pp-reviews-card">
                        <div className="pp-reviews-head">
                            <div className="pp-reviews-score">{Number(product.average_rating || 0).toFixed(1)}</div>
                            <Stars value={product.average_rating} />
                            <div className="pp-reviews-count">{reviews.length} reviews</div>
                        </div>

                        <div className="pp-review-list">
                            {reviews.length === 0 ? (
                                <div className="pp-empty">No reviews yet.</div>
                            ) : (
                                reviews.map((r) => (
                                    <div key={r.id} className="pp-review-item">
                                        <div className="pp-review-head">
                                            <div className="pp-review-user">
                                                <img className="pp-avatar" src={r.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${r.username}`} alt={r.username} />
                                                <div>
                                                    <div className="pp-username">{r.username}</div>
                                                    <Stars value={r.rating} />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="pp-review-text">{r.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pp-review-box">
                            <h4>Write a review</h4>
                            {user?.username ? (
                                <form onSubmit={submitReview} className="pp-review-form">
                                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))} disabled={posting}>
                                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                                    </select>
                                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." disabled={posting} required />
                                    <button className="btn btn-primary" disabled={posting} type="submit">{posting ? "Posting..." : "Submit Review"}</button>
                                </form>
                            ) : (
                                <div className="auth-prompt">
                                    <p>Please sign in to share your feedback.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            <div className="container pp-related">
                <h3>Recommended for You</h3>
                <div className="pp-related-grid">
                    {related.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
        </div>
    );
}
