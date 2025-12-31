import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Star, ThumbsUp, ShoppingCart } from "lucide-react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../App";

const normalizeProduct = (p) => {
    if (!p) return null;
    const imgs = Array.isArray(p.images)
        ? p.images
        : (p.images ? String(p.images).split("||") : []);
    return { ...p, images: imgs.filter(Boolean) };
};

const Stars = ({ value = 0 }) => {
    const v = Math.round(Number(value || 0));
    return (
        <span className="pp-stars" aria-label={`${v} stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < v ? "pp-star on" : "pp-star"} />
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
        setActiveProductTitle
    } = useAppContext();

    const [product, setProduct] = useState(null);
    const [activeImage, setActiveImage] = useState("");
    const [related, setRelated] = useState([]);

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI tabs
    const [tab, setTab] = useState("details");

    // review form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);

    const productId = useMemo(() => Number(id), [id]);

    // ✅ clear header title when leaving product page
    useEffect(() => {
        return () => setActiveProductTitle("");
    }, [setActiveProductTitle]);

    const addToCart = () => {
        if (!product) return;
        setCart([...(cart || []), product]);
        setIsCartOpen(true);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pRes, rRes, relRes] = await Promise.all([
                axios.get(`${API_URL}/products/${productId}`),
                axios.get(`${API_URL}/products/${productId}/reviews`),
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const handleLike = async (reviewId) => {
        if (!user) return alert("Please register to like reviews.");
        try {
            await axios.post(`${API_URL}/reviews/${reviewId}/like`, { device_id: user.device_id });
            setReviews((prev) =>
                prev.map((r) =>
                    r.id === reviewId
                        ? { ...r, likes_count: (r.likes_count || 0) + 1 }
                        : r
                )
            );
        } catch (e) {
            console.error("Like failed:", e);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please register to write a review.");
        if (!comment.trim()) return alert("Please type a review.");

        setPosting(true);
        try {
            await axios.post(`${API_URL}/products/${productId}/reviews`, {
                device_id: user.device_id,
                rating,
                comment,
            });
            setComment("");
            setRating(5);
            setTab("reviews");
            await fetchAll();
        } catch (e) {
            console.error("Review failed:", e);
            alert("Could not post review.");
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="loading container">Loading product…</div>;
    if (!product) return <div className="container">Product not found.</div>;

    const avg = Number(product.average_rating || 0);
    const count = Number(product.review_count || 0);

    return (
        <div className="pp-page">
            <div className="container pp-grid pp-grid--v2">
                {/* LEFT: Gallery */}
                <section className="pp-gallery">
                    <div className="pp-gallery-main">
                        {activeImage ? (
                            <img src={activeImage} alt={product.name} />
                        ) : (
                            <div className="pp-noimg">No image</div>
                        )}
                    </div>

                    <div className="pp-gallery-strip">
                        {(product.images || []).map((img, i) => (
                            <button
                                key={i}
                                className={`pp-strip-item ${activeImage === img ? "active" : ""}`}
                                onClick={() => setActiveImage(img)}
                                type="button"
                                aria-label={`View image ${i + 1}`}
                            >
                                <img src={img} alt={`${product.name} ${i + 1}`} />
                            </button>
                        ))}
                    </div>

                    <div className="pp-info-card">
                        <h1 className="pp-title">{product.name}</h1>

                        <div className="pp-info-meta">
                            <Stars value={Number(product.average_rating || 0)} />
                            <span className="pp-meta-text">
                                {Number(product.average_rating || 0).toFixed(1)} •{" "}
                                {Number(product.review_count || 0)} reviews
                            </span>
                        </div>

                        <p className="pp-desc">{product.description}</p>

                        <div className="pp-price-row">
                            <div className="pp-price">${Number(product.price).toFixed(2)}</div>
                            {product.badge && <span className="pp-badge">{product.badge}</span>}
                        </div>

                        <button className="btn btn-primary pp-add" onClick={addToCart} type="button">
                            <ShoppingCart size={18} />
                            Add to shopping cart
                        </button>

                        <div className="pp-hint">
                            {user ? (
                                <span></span>
                            ) : (
                                <span>Guest mode — register to like & review ✨</span>
                            )}
                        </div>
                    </div>
                </section>

                {/* MIDDLE: Info */}
                {/* <section className="pp-info">
                    <div className="pp-info-card">
                        <h1 className="pp-title">{product.name}</h1>

                        <div className="pp-info-meta">
                            <Stars value={Number(product.average_rating || 0)} />
                            <span className="pp-meta-text">
                                {Number(product.average_rating || 0).toFixed(1)} •{" "}
                                {Number(product.review_count || 0)} reviews
                            </span>
                        </div>

                        <p className="pp-desc">{product.description}</p>

                        <div className="pp-price-row">
                            <div className="pp-price">${Number(product.price).toFixed(2)}</div>
                            {product.badge && <span className="pp-badge">{product.badge}</span>}
                        </div>

                        <button className="btn btn-primary pp-add" onClick={addToCart} type="button">
                            <ShoppingCart size={18} />
                            Add to shopping cart
                        </button>

                        <div className="pp-hint">
                            {user ? (
                                <span>Logged in as {user.username.split(" ")[0]} ✅</span>
                            ) : (
                                <span>Guest mode — register to like & review ✨</span>
                            )}
                        </div>
                    </div>
                </section> */}

                {/* RIGHT: Reviews */}
                <aside className="pp-reviews-side">
                    <div className="pp-reviews-card">
                        <div className="pp-reviews-head">
                            <div>
                                <div className="pp-reviews-score">
                                    {Number(product.average_rating || 0).toFixed(1)}
                                </div>
                                <div className="pp-reviews-stars">
                                    <Stars value={Number(product.average_rating || 0)} />
                                </div>
                                <div className="pp-reviews-count">
                                    {reviews.length} reviews
                                </div>
                            </div>
                        </div>

                        <div className="pp-review-list">
                            {reviews.length === 0 ? (
                                <div className="pp-empty">No reviews yet.</div>
                            ) : (
                                reviews.map((r) => (
                                    <div key={r.id} className="pp-review-item">
                                        <div className="pp-review-head">
                                            <div className="pp-review-user">
                                                <img
                                                    className="pp-avatar"
                                                    src={r.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"}
                                                    alt={r.username || "User"}
                                                />
                                                <div>
                                                    <div className="pp-username">{r.username || "User"}</div>
                                                    <Stars value={r.rating} />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="pp-like"
                                                onClick={() => handleLike(r.id)}
                                                title={user ? "Like" : "Register to like"}
                                            >
                                                <ThumbsUp size={16} />
                                                <span>{r.likes_count || 0}</span>
                                            </button>
                                        </div>

                                        <p className="pp-review-text">{r.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Review form (inside the same card like the reference) */}
                        <div className="pp-review-box">
                            <div className="pp-review-box-top">
                                <h4>Write a review</h4>
                                {!user && <span className="pp-note">Register to post ✨</span>}
                            </div>

                            <form onSubmit={submitReview} className="pp-review-form">
                                <label className="pp-label">
                                    Rating
                                    <select
                                        value={rating}
                                        onChange={(e) => setRating(Number(e.target.value))}
                                        disabled={!user || posting}
                                    >
                                        {[5, 4, 3, 2, 1].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="pp-label">
                                    Comment
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us what you think..."
                                        disabled={!user || posting}
                                    />
                                </label>

                                <button className="btn btn-primary" disabled={!user || posting} type="submit">
                                    {posting ? "Posting..." : "Submit"}
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>
            </div>


            {/* RELATED */}
            <div className="container pp-related">
                <div className="pp-related-head">
                    <h3>Related products</h3>
                </div>

                <div className="pp-related-grid">
                    {related.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        </div>
    );
}
