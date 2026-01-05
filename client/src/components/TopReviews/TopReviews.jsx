import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Star, ThumbsUp } from 'lucide-react';
import { useAppContext } from '../../App';
import './TopReviews.css';

const TopReviews = () => {
    const { user, API_URL } = useAppContext();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        const calculateCols = () => {
            const width = window.innerWidth;
            const availableWidth = Math.min(width, 1400) - 40;
            const cols = Math.floor((availableWidth + 30) / 350); // 320px min + 30px gap
            setVisibleCount(Math.max(1, cols));
        };

        window.addEventListener('resize', calculateCols);
        calculateCols();

        const fetchTopReviews = async () => {
            try {
                const res = await axios.get(`${API_URL}/reviews/top`);
                setReviews(res.data);
            } catch (err) {
                console.error('Error fetching top reviews:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTopReviews();

        return () => window.removeEventListener('resize', calculateCols);
    }, [API_URL]);

    const handleLike = async (reviewId) => {
        if (!user) {
            alert('Please register to like reviews and show your appreciation.');
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

    if (loading || reviews.length === 0) return null;

    return (
        <section className="top-reviews container">
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="reviews-grid">
                {reviews.slice(0, visibleCount).map(review => (
                    <div key={review.id} className="review-card glass fade-in">
                        <div className="review-product-info">
                            <img src={review.product_image} alt={review.product_name} />
                            <span>{review.product_name}</span>
                        </div>
                        <div className="review-content">
                            {/* <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill={i < review.rating ? "#ff9900" : "none"}
                                        color="#ff9900"
                                    />
                                ))}
                            </div> */}
                            <p>"{review.comment}"</p>
                            <div className="review-footer">
                                <div className="reviewer-info">
                                    <img src={review.avatar_url || 'https://i.pravatar.cc/150?u=default'} alt={review.username} className="reviewer-avatar-small" />
                                    <div className="reviewer-text">
                                        <span className="reviewer">{review.username}</span>
                                    </div>
                                </div>
                                <button className="like-btn" onClick={() => handleLike(review.id)}>
                                    <ThumbsUp size={14} /> {review.likes_count}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TopReviews;
