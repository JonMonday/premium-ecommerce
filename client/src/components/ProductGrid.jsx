import React from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '../App';

const ProductGrid = ({ onProductClick }) => {
    const { products, loading } = useAppContext();

    if (loading) {
        return <div className="loading">Loading our finest collection...</div>;
    }

    return (
        <div className="product-grid container">
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onProductClick}
                />
            ))}
        </div>
    );
};

export default ProductGrid;
