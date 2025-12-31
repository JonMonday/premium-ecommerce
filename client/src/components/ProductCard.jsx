import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, onClick }) => {

    const navigate = useNavigate();
    const handleClick = () => {
        if (onClick) return onClick(product);
        navigate(`/product/${product.id}`);
    };

    const image =
        product?.image ||
        (Array.isArray(product?.images) ? product.images[0] : null) ||
        'https://via.placeholder.com/600x600?text=Product';


    return (
        <div className="product-card fade-in" onClick={handleClick}>
            {product.badge && <div className="product-badge">{product.badge}</div>}
            <div className="product-image">
                <img src={image} alt={product?.name || 'Product'} loading="lazy" decoding="async" />
                {product?.badge && <span className="product-badge">{product.badge}</span>}
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
                    <span className="review-count">({product?.review_count.toLocaleString()})</span>
                </div>
                <div className="product-price">
                    <span className="currency">$</span>
                    <span className="price-amount">{product?.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
