import React from 'react';
import { Star, Heart, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../App';
import './ProductCard.css';

const ProductCard = ({ product, onClick }) => {
    const { wishlist, likes, toggleWishlist, toggleLike } = useAppContext();
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) return onClick(product);
        navigate(`/product/${product.id}`);
    };

    const isWishlisted = wishlist.some(p => p.id === product.id);
    const isLiked = likes.products.includes(product.id);

    const handleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(product.id);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        toggleLike('product', product.id);
    };

    const image =
        product?.image ||
        (Array.isArray(product?.images) ? product.images[0] : null) ||
        'https://via.placeholder.com/600x600?text=Product';

    const hasDiscount = product.discounted_price && product.discounted_price < product.price;

    return (
        <div className="product-card fade-in" onClick={handleClick}>
            <div className="product-image">
                <img src={image} alt={product?.name || 'Product'} loading="lazy" decoding="async" />
                <div className="product-actions">
                    <button
                        className={`action-btn ${isWishlisted ? 'active' : ''}`}
                        onClick={handleWishlist}
                        title="Add to Wishlist"
                    >
                        <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                    <button
                        className={`action-btn ${isLiked ? 'active' : ''}`}
                        onClick={handleLike}
                        title="Like Product"
                    >
                        <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                </div>
                {(product.badge || product.promotion) && (
                    <div className="product-badges">
                        {product.promotion && <span className="promo-badge">{product.promotion.title}</span>}
                        {product.badge && <span className="product-badge">{product.badge}</span>}
                    </div>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-name">{product?.name}</h3>
                <p className="product-description">{product?.description}</p>
                <div className="product-rating">
                    <div className="stars">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                fill={i < Math.floor(product?.average_rating) ? "#ff9900" : "none"}
                                color="#ff9900"
                            />
                        ))}
                    </div>
                    <span className="review-count">({product?.review_count?.toLocaleString()})</span>
                </div>
                <div className="product-price-container">
                    {hasDiscount ? (
                        <div className="price-stack">
                            <span className="original-price">${product.price.toFixed(2)}</span>
                            <div className="discounted-price">
                                <span className="currency">$</span>
                                <span className="price-amount">{product.discounted_price.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="product-price">
                            <span className="currency">$</span>
                            <span className="price-amount">{product?.price.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
