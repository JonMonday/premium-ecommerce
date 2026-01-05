import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, X, ShoppingCart, ThumbsUp } from 'lucide-react';
import { useAppContext } from '../../App';
import './ProductModal.css';

const ProductModal = ({ product, onClose, onAddToCart, API_URL }) => {
    const { user } = useAppContext();
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [activeImage, setActiveImage] = useState(product.images[0]);

    const handleLike = async (reviewId) => {
        if (!user) {
            alert('Please register to like reviews.');
            return;
        }
        try {
            await axios.post(`${API_URL}/reviews/${reviewId}/like`);
            setReviews(reviews.map(r =>
                r.id === reviewId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
            ));
        } catch (err) {
            console.error('Error liking review:', err);
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await axios.get(`${API_URL}/products/${product.id}/reviews`);
                setReviews(res.data);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [product.id, API_URL]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content product-detail glass fade-in" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><X /></button>

                <div className="product-detail-layout">
                    <div className="product-images-gallery">
                        <div className="main-image">
                            <img src={activeImage} alt={product.name} />
                        </div>
                        <div className="thumbnail-list">
                            {product.images.map((img, i) => (
                                <div
                                    key={i}
                                    className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                                    onClick={() => setActiveImage(img)}
                                >
                                    <img src={img} alt={`${product.name} ${i}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="product-purchase-info">
                        <h2 className="detail-name">{product.name}</h2>
                        <div className="detail-rating">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        fill={i < Math.floor(product.average_rating) ? "#ff9900" : "none"}
                                        color="#ff9900"
                                    />
                                ))}
                            </div>
                            <span className="total-rating">{product.average_rating} rating</span>
                            <span className="separator">|</span>
                            <span className="detail-review-count">{product.review_count.toLocaleString()} reviews</span>
                        </div>
                        <div className="detail-price">
                            <span className="currency">$</span>
                            <span className="price-val">{product.price.toFixed(2)}</span>
                        </div>
                        <div className="detail-description">
                            <h3>About this item</h3>
                            <p>{product.description}</p>
                        </div>
                        <button className="btn btn-primary add-to-cart-btn" onClick={() => onAddToCart(product)}>
                            <ShoppingCart size={18} /> Add to Cart
                        </button>
                    </div>
                </div>

                <div className="product-reviews-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Customer Reviews</h3>
                        {user && <button className="btn btn-secondary btn-small">Write a Review</button>}
                    </div>

                    {!user && (
                        <div className="guest-notice glass" style={{ marginBottom: '20px' }}>
                            <p>Please <strong>register</strong> to share your experience and write reviews for our boutique collection.</p>
                            <button className="btn btn-primary btn-small" onClick={() => window.location.reload()}>Sign Up</button>
                        </div>
                    )}

                    {loadingReviews ? (
                        <p>Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <div key={review.id} className="review-item">
                                    <div className="review-header">
                                        <div className="user-rating">
                                            <img src={review.avatar_url || 'https://i.pravatar.cc/150?u=default'} alt={review.username} className="reviewer-avatar-mini" />
                                            <span className="review-user">{review.username}</span>
                                            <Star fill="#ff9900" color="#ff9900" size={12} style={{ marginLeft: '10px' }} />
                                        </div>
                                        <div className="review-likes" onClick={() => handleLike(review.id)} style={{ cursor: 'pointer' }}>
                                            <ThumbsUp size={12} /> {review.likes_count || 0}
                                        </div>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No reviews yet. Be the first to review!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
