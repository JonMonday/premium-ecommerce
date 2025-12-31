import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import { useAppContext } from '../App';

const TopProducts = () => {
    const { API_URL, setSelectedProduct } = useAppContext();
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        const calculateCols = () => {
            const width = window.innerWidth;
            let cols = 1;

            if (width > 768) {
                const availableWidth = Math.min(width, 1400) - 40;
                cols = Math.floor(availableWidth / 300); // 280px + 20px gap
            } else {
                const availableWidth = width - 40;
                cols = Math.floor(availableWidth / 172); // 160px + 12px gap
            }

            setVisibleCount(Math.max(1, cols) * 2);
        };

        window.addEventListener('resize', calculateCols);
        calculateCols();

        const fetchTop = async () => {
            try {
                // Fetch top 12 products to ensure we have enough for 2 rows
                const res = await axios.get(`${API_URL}/products`, {
                    params: { sort: "popular", page: 1, limit: 12 }
                });

                const data = res.data;
                const items = Array.isArray(data) ? data : (data.items || []);

                setTopProducts(items.slice(0, 12));
            } catch (err) {
                console.error('Error fetching top products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTop();
        return () => window.removeEventListener('resize', calculateCols);
    }, [API_URL]);

    if (loading) return null;

    return (
        <section className="top-products container">
            <h2 className="section-title">Trending Now</h2>
            <div className="product-grid">
                {topProducts.slice(0, visibleCount).map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={setSelectedProduct}
                    />
                ))}
            </div>
        </section>
    );
};

export default TopProducts;
